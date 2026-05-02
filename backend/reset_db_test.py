import sqlite3
import json
import os
import random
from datetime import datetime, timedelta

DB_PATH = 'database.db' 
if not os.path.exists(DB_PATH):
    DB_PATH = 'db/database.db'

# --- Master Lists ---
LAND_PRODUCTS_FULL = [
    ('land_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'),
    ('land_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
    ('land_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'),
    ('land_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('land_25', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
    ('land_26', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'),
]

SCHOOL_PRODUCTS_FULL = [
    ('school_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'),
    ('school_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('school_60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
]

def reset_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Cleaning database...")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM master_products")
    try: cursor.execute("DELETE FROM delivery_tracking")
    except: pass
    
    print("Seeding master_products...")
    for p_id, name, cat, unit in LAND_PRODUCTS_FULL:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)",
                       (p_id, name, cat, unit, 10000, 'land'))
    for p_id, name, cat, unit in SCHOOL_PRODUCTS_FULL:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)",
                       (p_id, name, cat, unit, 10000, 'school'))

    BRANCHES = ['beltepa_land', 'uchtepa_land', 'novza_school', 'uchtepa_school']
    STATUSES = ['review_snabjenec', 'sent_to_supplier', 'waiting_snabjenec_receive', 'sent_to_financier', 'archived']

    print("Generating 30 random orders with Tracking...")
    for i in range(30):
        order_id = f"test_order_{i+1}"
        branch = random.choice(BRANCHES)
        status = random.choice(STATUSES)
        b_type = 'school' if 'school' in branch else 'land'
        pool = SCHOOL_PRODUCTS_FULL if b_type == 'school' else LAND_PRODUCTS_FULL
        
        selected = random.sample(pool, min(4, len(pool)))
        products_json = []
        tracking_json = {}
        
        for p_id, name, cat, unit in selected:
            ordered_qty = random.randint(10, 50)
            price = random.randint(5000, 50000)
            
            # Products list
            products_json.append({
                "id": p_id, "name": name, "category": cat, "quantity": ordered_qty, "unit": unit,
                "price": price if status != 'review_snabjenec' else 0,
                "checked": status in ['waiting_snabjenec_receive', 'sent_to_financier', 'archived']
            })
            
            # Tracking data (IF status is advanced)
            if status in ['sent_to_financier', 'archived', 'waiting_snabjenec_receive']:
                # For realism, received_qty is 90-100% of ordered_qty
                received_qty = ordered_qty if random.random() > 0.2 else ordered_qty - 1
                tracking_json[p_id] = {
                    "ordered_qty": ordered_qty,
                    "received_qty": received_qty,
                    "price_at_delivery": price
                }

        created_at = (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat()
        cursor.execute("""
            INSERT INTO orders (id, branch, status, products, createdAt, supplier_responded, delivery_tracking) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (order_id, branch, status, json.dumps(products_json), created_at, 
              1 if status != 'review_snabjenec' else 0, 
              json.dumps(tracking_json)))

    conn.commit()
    print("Success! Fact sums should now be visible.")
    conn.close()

if __name__ == "__main__":
    reset_db()
