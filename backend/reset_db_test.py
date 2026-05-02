import sqlite3
import json
import os
import random
from datetime import datetime, timedelta

DB_PATH = 'database.db' 
if not os.path.exists(DB_PATH):
    DB_PATH = 'db/database.db'

LAND_PRODUCTS_FULL = [
    ('land_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'), ('land_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
    ('land_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'), ('land_4', 'Каймак (Qaymoq)', '🥛 Молочные продукты', 'кг'),
    ('land_5', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты', 'кг'), ('land_6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг'),
    ('land_10', 'Яйцо куриное (Tovuq tuxumi)', '🥚 Яйца', 'шт'), ('land_11', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг'),
    ('land_18', 'Растительное масло (Paxta yog‘i)', '🥫 Соусы и добавки', 'л'), ('land_22', 'Мука (Un)', '🍝 Макароны и мука', 'кг'),
    ('land_24', 'Хлеб (Non)', '🍞 Хлеб и выпечка', 'шт'), ('land_25', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
    ('land_26', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'), ('land_30', 'Яблоко (Olma)', '🍎 Фрукты и сухофрукты', 'кг'),
    ('land_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'), ('land_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг'),
]

SCHOOL_PRODUCTS_FULL = [
    ('school_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'), ('school_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('school_13', 'Яйца куриные (Tovuq tuxumi)', '🥚 Яйца и мясо', 'шт'), ('school_21', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт'),
    ('school_60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
]

def reset_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM master_products")
    try: cursor.execute("DELETE FROM delivery_tracking")
    except: pass
    
    for p_id, name, cat, unit in LAND_PRODUCTS_FULL + SCHOOL_PRODUCTS_FULL:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)",
                       (p_id, name, cat, unit, 12000, 'land' if 'land' in p_id else 'school'))

    BRANCHES = ['beltepa_land', 'uchtepa_land', 'novza_school', 'uchtepa_school']
    STATUSES = ['review_snabjenec', 'sent_to_supplier', 'waiting_snabjenec_receive', 'sent_to_financier', 'archived']

    for i in range(30):
        order_id = f"test_order_{i+1}"
        branch = random.choice(BRANCHES)
        status = random.choice(STATUSES)
        b_type = 'school' if 'school' in branch else 'land'
        pool = SCHOOL_PRODUCTS_FULL if b_type == 'school' else LAND_PRODUCTS_FULL
        selected = random.sample(pool, min(5, len(pool)))
        
        products_json = []
        tracking_json = {}
        for p_id, name, cat, unit in selected:
            ordered_qty = random.randint(10, 100)
            price = random.randint(5000, 45000)
            products_json.append({"id": p_id, "name": name, "category": cat, "quantity": ordered_qty, "unit": unit, "price": price if status != 'review_snabjenec' else 0, "checked": status != 'review_snabjenec'})
            if status in ['sent_to_financier', 'archived', 'waiting_snabjenec_receive']:
                tracking_json[p_id] = {"ordered_qty": ordered_qty, "received_qty": ordered_qty if random.random() > 0.1 else ordered_qty - 1, "price_at_delivery": price}

        created_at = (datetime.now() - timedelta(days=random.randint(0, 10))).isoformat()
        cursor.execute("INSERT INTO orders (id, branch, status, products, createdAt, supplier_responded, delivery_tracking) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (order_id, branch, status, json.dumps(products_json), created_at, 1 if status != 'review_snabjenec' else 0, json.dumps(tracking_json)))
    conn.commit()
    print("Restore done. Full lists and Fact sums are ready!")
    conn.close()

if __name__ == "__main__":
    reset_db()
