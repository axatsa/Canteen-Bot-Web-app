"""
Seed test orders with various statuses for development/testing.
Run from backend/ directory:
    python seed_test_orders.py
"""
import json
import uuid
from datetime import datetime, timedelta
from app.database import get_db_connection, init_db

PRODUCTS_LAND = [
    {"id": "p1", "name": "Помидоры Черри", "category": "🥗 Овощи и зелень", "unit": "кг", "quantity": 5, "price": 18000},
    {"id": "p2", "name": "Огурцы", "category": "🥗 Овощи и зелень", "unit": "кг", "quantity": 3, "price": 12000},
    {"id": "p3", "name": "Молоко 3.5%", "category": "🥛 Молочные продукты", "unit": "л", "quantity": 10, "price": 9500},
    {"id": "p4", "name": "Масло подсолнечное", "category": "🧴 Масло и жиры", "unit": "л", "quantity": 2, "price": 22000},
]

PRODUCTS_SCHOOL = [
    {"id": "p1", "name": "Рис длиннозёрный", "category": "🌾 Крупы и макароны", "unit": "кг", "quantity": 20, "price": 14000},
    {"id": "p2", "name": "Куриное филе", "category": "🥩 Мясо и птица", "unit": "кг", "quantity": 15, "price": 45000},
    {"id": "p3", "name": "Морковь", "category": "🥗 Овощи и зелень", "unit": "кг", "quantity": 8, "price": 7000},
    {"id": "p4", "name": "Лук репчатый", "category": "🥗 Овощи и зелень", "unit": "кг", "quantity": 6, "price": 5000},
    {"id": "p5", "name": "Яйца куриные", "category": "🥚 Яйца", "unit": "шт", "quantity": 100, "price": 1800},
]

def make_order(branch, status, products, days_ago=0, delivery_tracking=None, extra_items=None, supplier_responded=False):
    order_id = str(uuid.uuid4())
    created = datetime.now() - timedelta(days=days_ago)
    return {
        "id": order_id,
        "status": status,
        "branch": branch,
        "products": products,
        "createdAt": created.isoformat(),
        "supplierResponded": supplier_responded,
        "deliveryTracking": delivery_tracking or {},
        "extraItemsDelivered": extra_items or {},
    }

ORDERS = [
    # 1. Шеф только создал — ждёт отправки снабженцу
    make_order("beltepa_land", "sent_to_chef", [
        {**p, "quantity": p["quantity"]} for p in PRODUCTS_LAND
    ], days_ago=0),

    # 2. Снабженец проверяет — отправит поставщику
    make_order("uchtepa_land", "review_snabjenec", [
        {**p} for p in PRODUCTS_LAND
    ], days_ago=1),

    # 3. Поставщик получил — ставит цены
    make_order("novza_school", "sent_to_supplier", [
        {**p} for p in PRODUCTS_SCHOOL
    ], days_ago=2),

    # 4. Ожидание привоза снабженцем
    make_order("uchtepa_school", "waiting_snabjenec_receive", [
        {**p} for p in PRODUCTS_SCHOOL
    ], days_ago=3, supplier_responded=True, delivery_tracking={
        "p1": {"ordered_qty": 20, "received_qty": 0, "status": "pending"},
        "p2": {"ordered_qty": 15, "received_qty": 0, "status": "pending"},
        "p3": {"ordered_qty": 8,  "received_qty": 0, "status": "pending"},
        "p4": {"ordered_qty": 6,  "received_qty": 0, "status": "pending"},
        "p5": {"ordered_qty": 100,"received_qty": 0, "status": "pending"},
    }),

    # 5. Частично получено — снабженец принимает
    make_order("almazar_school", "waiting_snabjenec_receive", [
        {**p} for p in PRODUCTS_SCHOOL
    ], days_ago=2, supplier_responded=True, delivery_tracking={
        "p1": {"ordered_qty": 20, "received_qty": 18, "status": "partial"},
        "p2": {"ordered_qty": 15, "received_qty": 15, "status": "delivered"},
        "p3": {"ordered_qty": 8,  "received_qty": 0,  "status": "pending"},
        "p4": {"ordered_qty": 6,  "received_qty": 6,  "status": "delivered"},
        "p5": {"ordered_qty": 100,"received_qty": 90, "status": "partial"},
    }),

    # 6. Шеф проверяет доставку
    make_order("rakat_land", "chef_checking", [
        {**p} for p in PRODUCTS_LAND
    ], days_ago=4, supplier_responded=True),

    # 7. У финансиста на финальной проверке
    make_order("mukumiy_land", "financier_checking", [
        {**p} for p in PRODUCTS_LAND
    ], days_ago=5, supplier_responded=True),

    # 8. Ещё одна у финансиста — другой филиал
    make_order("general_uzakov_school", "financier_checking", [
        {**p} for p in PRODUCTS_SCHOOL
    ], days_ago=6, supplier_responded=True),

    # 9. Архивирована
    make_order("yunusabad_land", "archived", [
        {**p} for p in PRODUCTS_LAND
    ], days_ago=10, supplier_responded=True),

    # 10. Архивирована — школа
    make_order("namangan_school", "archived", [
        {**p} for p in PRODUCTS_SCHOOL
    ], days_ago=12, supplier_responded=True),
]

def seed():
    init_db()
    conn = get_db_connection()
    inserted = 0
    for order in ORDERS:
        existing = conn.execute("SELECT id FROM orders WHERE id = ?", (order["id"],)).fetchone()
        if not existing:
            conn.execute(
                "INSERT INTO orders (id, status, data) VALUES (?, ?, ?)",
                (order["id"], order["status"], json.dumps(order))
            )
            inserted += 1
    conn.commit()
    conn.close()
    print(f"✅ Вставлено {inserted} тестовых заявок (из {len(ORDERS)})")
    print("Статусы:")
    for o in ORDERS:
        print(f"  {o['status']:35} | {o['branch']}")

if __name__ == "__main__":
    seed()
