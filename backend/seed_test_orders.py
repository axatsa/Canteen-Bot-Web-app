"""
Seed test orders with various statuses for development/testing.
Run inside the api container:
    docker compose exec api python seed_test_orders.py
"""
import json
import uuid
from datetime import datetime, timedelta
from app.database import get_db_connection, init_db

PRODUCTS_LAND = [
    {"id": "p1", "name": "Помидоры Черри",    "category": "🥗 Овощи и зелень",      "unit": "кг", "quantity": 5,   "price": 18000},
    {"id": "p2", "name": "Огурцы",             "category": "🥗 Овощи и зелень",      "unit": "кг", "quantity": 3,   "price": 12000},
    {"id": "p3", "name": "Молоко 3.5%",        "category": "🥛 Молочные продукты",   "unit": "л",  "quantity": 10,  "price": 9500},
    {"id": "p4", "name": "Масло подсолнечное", "category": "🧴 Масло и жиры",        "unit": "л",  "quantity": 2,   "price": 22000},
]

PRODUCTS_SCHOOL = [
    {"id": "p1", "name": "Рис длиннозёрный",  "category": "🌾 Крупы и макароны",    "unit": "кг", "quantity": 20,  "price": 14000},
    {"id": "p2", "name": "Куриное филе",       "category": "🥩 Мясо и птица",        "unit": "кг", "quantity": 15,  "price": 45000},
    {"id": "p3", "name": "Морковь",            "category": "🥗 Овощи и зелень",      "unit": "кг", "quantity": 8,   "price": 7000},
    {"id": "p4", "name": "Лук репчатый",       "category": "🥗 Овощи и зелень",      "unit": "кг", "quantity": 6,   "price": 5000},
    {"id": "p5", "name": "Яйца куриные",       "category": "🥚 Яйца",                "unit": "шт", "quantity": 100, "price": 1800},
]

ORDERS = [
    # 1. Шеф создал — ждёт отправки снабженцу
    {
        "branch": "beltepa_land", "status": "sent_to_chef",
        "products": PRODUCTS_LAND, "days_ago": 0,
    },
    # 2. Снабженец проверяет
    {
        "branch": "uchtepa_land", "status": "review_snabjenec",
        "products": PRODUCTS_LAND, "days_ago": 1,
    },
    # 3. Поставщик получил — ставит цены
    {
        "branch": "novza_school", "status": "sent_to_supplier",
        "products": PRODUCTS_SCHOOL, "days_ago": 2,
    },
    # 4. Ожидание привоза
    {
        "branch": "uchtepa_school", "status": "waiting_snabjenec_receive",
        "products": PRODUCTS_SCHOOL, "days_ago": 3, "supplier_responded": True,
        "delivery_tracking": {
            "p1": {"ordered_qty": 20,  "received_qty": 0,  "status": "pending"},
            "p2": {"ordered_qty": 15,  "received_qty": 0,  "status": "pending"},
            "p3": {"ordered_qty": 8,   "received_qty": 0,  "status": "pending"},
            "p4": {"ordered_qty": 6,   "received_qty": 0,  "status": "pending"},
            "p5": {"ordered_qty": 100, "received_qty": 0,  "status": "pending"},
        },
    },
    # 5. Частично получено
    {
        "branch": "almazar_school", "status": "waiting_snabjenec_receive",
        "products": PRODUCTS_SCHOOL, "days_ago": 2, "supplier_responded": True,
        "delivery_tracking": {
            "p1": {"ordered_qty": 20,  "received_qty": 18, "status": "partial"},
            "p2": {"ordered_qty": 15,  "received_qty": 15, "status": "delivered"},
            "p3": {"ordered_qty": 8,   "received_qty": 0,  "status": "pending"},
            "p4": {"ordered_qty": 6,   "received_qty": 6,  "status": "delivered"},
            "p5": {"ordered_qty": 100, "received_qty": 90, "status": "partial"},
        },
    },
    # 6. Шеф проверяет
    {
        "branch": "rakat_land", "status": "chef_checking",
        "products": PRODUCTS_LAND, "days_ago": 4, "supplier_responded": True,
    },
    # 7. Финансист проверяет #1
    {
        "branch": "mukumiy_land", "status": "financier_checking",
        "products": PRODUCTS_LAND, "days_ago": 5, "supplier_responded": True,
    },
    # 8. Финансист проверяет #2
    {
        "branch": "general_uzakov_school", "status": "financier_checking",
        "products": PRODUCTS_SCHOOL, "days_ago": 6, "supplier_responded": True,
    },
    # 9. Архив #1
    {
        "branch": "yunusabad_land", "status": "archived",
        "products": PRODUCTS_LAND, "days_ago": 10, "supplier_responded": True,
    },
    # 10. Архив #2
    {
        "branch": "namangan_school", "status": "archived",
        "products": PRODUCTS_SCHOOL, "days_ago": 12, "supplier_responded": True,
    },
]

def seed():
    init_db()
    conn = get_db_connection()
    inserted = 0

    for o in ORDERS:
        order_id = str(uuid.uuid4())
        created = (datetime.now() - timedelta(days=o.get("days_ago", 0))).isoformat()
        delivery_tracking = json.dumps(o.get("delivery_tracking", {}))
        extra_items = json.dumps({})
        supplier_responded = 1 if o.get("supplier_responded") else 0

        conn.execute(
            """INSERT INTO orders
               (id, status, products, createdAt, branch,
                delivery_tracking, supplier_responded, extra_items_delivered)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                order_id,
                o["status"],
                json.dumps(o["products"]),
                created,
                o["branch"],
                delivery_tracking,
                supplier_responded,
                extra_items,
            )
        )
        inserted += 1

    conn.commit()
    conn.close()
    print(f"✅ Вставлено {inserted} тестовых заявок")
    print("Статусы:")
    for o in ORDERS:
        print(f"  {o['status']:35} | {o['branch']}")

if __name__ == "__main__":
    seed()
