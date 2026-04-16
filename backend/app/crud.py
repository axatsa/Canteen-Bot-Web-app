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
    
    # Fetch last prices map
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, last_price FROM master_products")
    last_prices = {row[0]: row[1] for row in cursor.fetchall()}
    conn.close()

    orders = []
    for row in rows:
        order_products = json.loads(row[2])
        for p in order_products:
            if 'id' in p and p['id'] in last_prices:
                p['lastPrice'] = last_prices[p['id']]
                
        orders.append({
            "id": row[0],
            "status": row[1],
            "products": order_products,
            "createdAt": row[3],
            "deliveredAt": row[4],
            "estimatedDeliveryDate": row[5],
            "branch": row[6]
        })
    return orders

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
