import json
import uuid
import logging
from typing import Optional, List, Dict
from .database import get_db_connection

logger = logging.getLogger(__name__)

def get_user_by_telegram_id(telegram_id: int) -> Optional[dict]:
    conn = get_db_connection()
    try:
        user = conn.execute('SELECT * FROM users WHERE telegram_id = ?', (telegram_id,)).fetchone()
        if user:
            return dict(user)
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
    finally:
        conn.close()
    return None

def save_user(telegram_id: int, full_name: str, role: str, branch: str, language: str) -> bool:
    conn = get_db_connection()
    try:
        existing = get_user_by_telegram_id(telegram_id)
        if existing:
            conn.execute('''
                UPDATE users SET
                    full_name = ?,
                    role = ?,
                    branch = ?,
                    language = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ?
            ''', (full_name, role, branch, language, telegram_id))
        else:
            conn.execute('''
                INSERT INTO users (id, telegram_id, full_name, role, branch, language)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (str(uuid.uuid4()), telegram_id, full_name, role, branch, language))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error saving user: {e}")
        return False
    finally:
        conn.close()

def get_all_products() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM master_products")
    rows = cursor.fetchall()
    conn.close()
    
    products = []
    for row in rows:
        # row: (id, name, category, unit, last_price)
        last_price = row[4] if len(row) > 4 else None
        products.append({
            "id": row[0],
            "name": row[1],
            "category": row[2],
            "unit": row[3],
            "quantity": 0,
            "lastPrice": last_price
        })
    return products

def get_all_orders() -> List[dict]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM orders")
    rows = cursor.fetchall()
    conn.close()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, last_price FROM master_products")
    last_prices = {row[0]: row[1] for row in cursor.fetchall()}
    conn.close()

    orders = []
    for row in rows:
        r = dict(row)
        order_products = json.loads(r['products'])
        for p in order_products:
            if 'id' in p and p['id'] in last_prices:
                p['lastPrice'] = last_prices[p['id']]
        orders.append({
            "id": r['id'],
            "status": r['status'],
            "products": order_products,
            "createdAt": r['createdAt'],
            "deliveredAt": r.get('deliveredAt'),
            "estimatedDeliveryDate": r.get('estimatedDeliveryDate'),
            "branch": r['branch'],
            "sentToSupplierAt": r.get('sent_to_supplier_at'),
            "receivedFromSupplierAt": r.get('received_from_supplier_at'),
            "deliveryTracking": json.loads(r['delivery_tracking'] or '{}'),
            "supplierResponded": bool(r.get('supplier_responded', 0)),
            "extraItemsDelivered": json.loads(r['extra_items_delivered'] or '{}'),
        })
    return orders

def get_order_by_id(order_id: str) -> Optional[dict]:
    conn = get_db_connection()
    try:
        row = conn.execute('SELECT * FROM orders WHERE id = ?', (order_id,)).fetchone()
        if not row:
            return None
        r = dict(row)
        r['products'] = json.loads(r['products'])
        r['deliveryTracking'] = json.loads(r.get('delivery_tracking') or '{}')
        r['extraItemsDelivered'] = json.loads(r.get('extra_items_delivered') or '{}')
        r['supplierResponded'] = bool(r.get('supplier_responded', 0))
        return r
    finally:
        conn.close()


def mark_supplier_received(order_id: str, received_date: str) -> bool:
    conn = get_db_connection()
    try:
        conn.execute('''
            UPDATE orders SET
                received_from_supplier_at = ?,
                supplier_responded = 1,
                status = CASE WHEN status = 'sent_to_supplier' THEN 'waiting_snabjenec_receive' ELSE status END
            WHERE id = ?
        ''', (received_date, order_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error marking supplier received: {e}")
        return False
    finally:
        conn.close()


def update_delivery_tracking(order_id: str, delivery_tracking: dict, extra_items: dict) -> bool:
    conn = get_db_connection()
    try:
        conn.execute('''
            UPDATE orders SET
                delivery_tracking = ?,
                extra_items_delivered = ?
            WHERE id = ?
        ''', (json.dumps(delivery_tracking), json.dumps(extra_items), order_id))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error updating delivery tracking: {e}")
        return False
    finally:
        conn.close()


def archive_order(order_id: str, archived_by: str = "snabjenec") -> bool:
    conn = get_db_connection()
    try:
        conn.execute(
            "UPDATE orders SET status = 'archived' WHERE id = ?",
            (order_id,)
        )
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error archiving order: {e}")
        return False
    finally:
        conn.close()


def _compute_delivery_stats(delivery_tracking: dict, products: list) -> dict:
    ordered_qty_map = {str(p['id']): p.get('quantity', 0) for p in products}
    total_ordered = 0
    total_received = 0
    delivered_items = []
    not_delivered_items = []

    for pid, info in delivery_tracking.items():
        ordered = info.get('ordered_qty', ordered_qty_map.get(pid, 0))
        received = info.get('received_qty', 0)
        total_ordered += ordered
        total_received += received
        product_name = next((p['name'] for p in products if str(p['id']) == pid), pid)
        unit = next((p['unit'] for p in products if str(p['id']) == pid), '')
        entry = {
            "product_id": pid,
            "product_name": product_name,
            "unit": unit,
            "ordered_qty": ordered,
            "received_qty": received,
            "status": info.get('status', 'pending'),
        }
        if received > 0:
            delivered_items.append(entry)
        else:
            not_delivered_items.append(entry)

    completion_rate = round(total_received / total_ordered * 100) if total_ordered > 0 else 0
    return {
        "total_ordered": total_ordered,
        "total_received": total_received,
        "completion_rate": completion_rate,
        "delivered_items": delivered_items,
        "not_delivered_items": not_delivered_items,
    }


def get_order_financier_details(order_id: str) -> Optional[dict]:
    order = get_order_by_id(order_id)
    if not order:
        return None

    products = order['products']
    tracking = order['deliveryTracking']
    extra_raw = order['extraItemsDelivered']
    stats = _compute_delivery_stats(tracking, products)

    conn = get_db_connection()
    try:
        mp_rows = conn.execute("SELECT id, name, unit FROM master_products").fetchall()
        master = {str(r['id']): dict(r) for r in mp_rows}
    finally:
        conn.close()

    extra_items = [
        {
            "product_id": pid,
            "product_name": master.get(pid, {}).get('name', pid),
            "unit": master.get(pid, {}).get('unit', ''),
            "qty": qty,
        }
        for pid, qty in extra_raw.items()
    ]

    return {
        "order": {
            "id": order['id'],
            "created_at": order['createdAt'],
            "status": order['status'],
            "branch": order['branch'],
        },
        "delivery": {
            "sent_to_supplier_at": order.get('sent_to_supplier_at'),
            "received_from_supplier_at": order.get('received_from_supplier_at'),
            "completion_rate": f"{stats['completion_rate']}%",
        },
        "delivered_items": stats['delivered_items'],
        "not_delivered_items": stats['not_delivered_items'],
        "extra_items": extra_items,
    }


def get_financier_all_orders(branch: Optional[str] = None, status: Optional[str] = None,
                              limit: int = 20, offset: int = 0) -> dict:
    conn = get_db_connection()
    try:
        conditions = []
        params = []
        if branch:
            conditions.append("branch = ?")
            params.append(branch)
        if status:
            statuses = [s.strip() for s in status.split(',')]
            placeholders = ','.join('?' * len(statuses))
            conditions.append(f"status IN ({placeholders})")
            params.extend(statuses)

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        total = conn.execute(f"SELECT COUNT(*) FROM orders {where}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM orders {where} ORDER BY createdAt DESC LIMIT ? OFFSET ?",
            params + [limit, offset]
        ).fetchall()

        orders = []
        for row in rows:
            r = dict(row)
            products = json.loads(r['products'])
            tracking = json.loads(r.get('delivery_tracking') or '{}')
            stats = _compute_delivery_stats(tracking, products)
            extra = json.loads(r.get('extra_items_delivered') or '{}')
            orders.append({
                "id": r['id'],
                "created_at": r['createdAt'],
                "status": r['status'],
                "branch": r['branch'],
                "total_items_ordered": stats['total_ordered'],
                "total_items_received": stats['total_received'],
                "completion_rate": stats['completion_rate'],
                "sent_to_supplier_at": r.get('sent_to_supplier_at'),
                "received_from_supplier_at": r.get('received_from_supplier_at'),
                "extra_items_count": len(extra),
                "supplier_responded": bool(r.get('supplier_responded', 0)),
            })
        return {"total": total, "orders": orders}
    finally:
        conn.close()


def get_financier_delivery_report(branch: Optional[str] = None) -> dict:
    conn = get_db_connection()
    try:
        conditions = ["status NOT IN ('sent_to_chef', 'review_snabjenec')"]
        params = []
        if branch:
            conditions.append("branch = ?")
            params.append(branch)
        where = f"WHERE {' AND '.join(conditions)}"
        rows = conn.execute(f"SELECT * FROM orders {where}", params).fetchall()
    finally:
        conn.close()

    product_map: Dict[str, dict] = {}
    total_orders = len(rows)
    total_ordered = 0
    total_received = 0
    order_summaries = []

    for row in rows:
        r = dict(row)
        products = json.loads(r['products'])
        tracking = json.loads(r.get('delivery_tracking') or '{}')
        stats = _compute_delivery_stats(tracking, products)
        total_ordered += stats['total_ordered']
        total_received += stats['total_received']
        order_summaries.append({
            "order_id": r['id'],
            "created_at": r['createdAt'],
            "items": stats['delivered_items'] + stats['not_delivered_items'],
            "completion_rate": f"{stats['completion_rate']}%",
        })
        for item in stats['delivered_items'] + stats['not_delivered_items']:
            pid = item['product_id']
            if pid not in product_map:
                product_map[pid] = {**item, "ordered_qty": 0, "received_qty": 0}
            product_map[pid]['ordered_qty'] += item['ordered_qty']
            product_map[pid]['received_qty'] += item['received_qty']

    completion_rate = round(total_received / total_ordered * 100) if total_ordered > 0 else 0
    return {
        "summary": {
            "total_orders": total_orders,
            "total_items_ordered": total_ordered,
            "total_items_received": total_received,
            "completion_rate": f"{completion_rate}%",
        },
        "by_items": list(product_map.values()),
        "by_orders": order_summaries,
    }


def get_financier_statistics(branch: Optional[str] = None) -> dict:
    conn = get_db_connection()
    try:
        conditions = ["status NOT IN ('sent_to_chef', 'review_snabjenec', 'sent_to_supplier')"]
        params = []
        if branch:
            conditions.append("branch = ?")
            params.append(branch)
        where = f"WHERE {' AND '.join(conditions)}"
        rows = conn.execute(f"SELECT * FROM orders {where}", params).fetchall()
    finally:
        conn.close()

    total_orders = len(rows)
    fully_delivered = 0
    partially_delivered = 0
    not_delivered = 0
    total_completion = 0

    for row in rows:
        r = dict(row)
        products = json.loads(r['products'])
        tracking = json.loads(r.get('delivery_tracking') or '{}')
        stats = _compute_delivery_stats(tracking, products)
        rate = stats['completion_rate']
        total_completion += rate
        if rate == 100:
            fully_delivered += 1
        elif rate > 0:
            partially_delivered += 1
        else:
            not_delivered += 1

    avg_rate = round(total_completion / total_orders, 1) if total_orders > 0 else 0
    return {
        "summary": {
            "total_orders": total_orders,
            "fully_delivered": fully_delivered,
            "partially_delivered": partially_delivered,
            "not_delivered": not_delivered,
            "average_completion_rate": avg_rate,
        }
    }


def get_financier_archive(branch: Optional[str] = None, limit: int = 20, offset: int = 0) -> dict:
    conn = get_db_connection()
    try:
        conditions = ["status = 'archived'"]
        params = []
        if branch:
            conditions.append("branch = ?")
            params.append(branch)
        where = f"WHERE {' AND '.join(conditions)}"
        total = conn.execute(f"SELECT COUNT(*) FROM orders {where}", params).fetchone()[0]
        rows = conn.execute(
            f"SELECT * FROM orders {where} ORDER BY createdAt DESC LIMIT ? OFFSET ?",
            params + [limit, offset]
        ).fetchall()

        archived = []
        for row in rows:
            r = dict(row)
            products = json.loads(r['products'])
            tracking = json.loads(r.get('delivery_tracking') or '{}')
            stats = _compute_delivery_stats(tracking, products)
            archived.append({
                "id": r['id'],
                "created_at": r['createdAt'],
                "branch": r['branch'],
                "completion_rate": stats['completion_rate'],
                "sent_to_supplier_at": r.get('sent_to_supplier_at'),
                "received_from_supplier_at": r.get('received_from_supplier_at'),
            })
        return {"total": total, "archived_orders": archived}
    finally:
        conn.close()


# ── Template CRUD ──────────────────────────────────────────────────────────────

def get_all_templates() -> List[dict]:
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM templates ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def save_template(name: str, description: str, file_path: str, file_size: int,
                  created_by: str = "") -> Optional[str]:
    conn = get_db_connection()
    try:
        tid = str(uuid.uuid4())
        conn.execute('''
            INSERT INTO templates (id, name, description, file_path, file_size, created_by)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (tid, name, description, file_path, file_size, created_by))
        conn.commit()
        return tid
    except Exception as e:
        logger.error(f"Error saving template: {e}")
        return None
    finally:
        conn.close()


def delete_template(template_id: str) -> bool:
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT file_path FROM templates WHERE id = ?", (template_id,)).fetchone()
        if not row:
            return False
        conn.execute("DELETE FROM templates WHERE id = ?", (template_id,))
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error deleting template: {e}")
        return False
    finally:
        conn.close()


def upsert_order(order_data: dict) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        products_json = json.dumps(order_data['products'])
        
        cursor.execute('''
        INSERT INTO orders (id, status, products, createdAt, deliveredAt, estimatedDeliveryDate, branch)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
            status=excluded.status,
            products=excluded.products,
            createdAt=excluded.createdAt,
            deliveredAt=excluded.deliveredAt,
            estimatedDeliveryDate=excluded.estimatedDeliveryDate,
            branch=excluded.branch
        ''', (
            order_data['id'], 
            order_data['status'], 
            products_json, 
            order_data['createdAt'], 
            order_data.get('deliveredAt'), 
            order_data.get('estimatedDeliveryDate'), 
            order_data['branch']
        ))
        
        # Update last_price
        for p in order_data['products']:
            if p.get('price') and p['price'] > 0:
                cursor.execute("UPDATE master_products SET last_price = ? WHERE id = ?", (p['price'], p['id']))
        
        conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error upserting order: {e}")
        return False
    finally:
        conn.close()
