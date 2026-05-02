import sqlite3
import json
import os
import random
from datetime import datetime, timedelta

DB_PATH = 'database.db' 
if not os.path.exists(DB_PATH):
    DB_PATH = 'db/database.db'

# --- Master Lists ---
BRANCHES = [
    'beltepa_land', 'uchtepa_land', 'rakat_land', 'novoi_land',
    'novza_school', 'uchtepa_school', 'almazar_school', 'novoi_school'
]

STATUSES = [
    'review_snabjenec',         # Новая
    'sent_to_supplier',         # У поставщика
    'waiting_snabjenec_receive',# На приемке
    'sent_to_financier',        # У финансиста
    'archived'                  # В архиве
]

MEAT_ITEMS = [
    ('beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('chicken', 'Курица (Fillet)', '🥩 Мясо', 'кг'),
    ('mutton', 'Баранина', '🥩 Мясо', 'кг'),
    ('mince', 'Фарш', '🥩 Мясо', 'кг')
]

PROD_ITEMS = [
    ('milk', 'Молоко', '🥛 Молочные продукты', 'л'),
    ('bread', 'Хлеб', '🍞 Хлеб и мучное', 'шт'),
    ('potato', 'Картофель', '🥕 Овощи и зелень', 'кг'),
    ('sugar', 'Сахар', '☕ Напитки и сладкое', 'кг'),
    ('oil', 'Масло', '🥫 Соусы и добавки', 'л')
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
    for p_id, name, cat, unit in MEAT_ITEMS + PROD_ITEMS:
        for b_type in ['land', 'school']:
            cursor.execute("""
                INSERT INTO master_products (id, name, category, unit, last_price, branch_type)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (f"{b_type}_{p_id}", name, cat, unit, random.randint(5000, 80000), b_type))

    print("Generating 30 random orders...")
    for i in range(30):
        order_id = f"test_order_{i+1}"
        branch = random.choice(BRANCHES)
        status = random.choice(STATUSES)
        
        # Determine order type: Meat, Products, or Mixed
        rand_type = random.random()
        order_items = []
        
        b_type = 'school' if 'school' in branch else 'land'
        
        if rand_type < 0.3: # Pure Meat
            pool = MEAT_ITEMS
        elif rand_type < 0.6: # Pure Products
            pool = PROD_ITEMS
        else: # Mixed
            pool = MEAT_ITEMS + PROD_ITEMS
            
        sample_size = random.randint(2, 5)
        selected = random.sample(pool, min(sample_size, len(pool)))
        
        products_json = []
        for p_id, name, cat, unit in selected:
            qty = random.randint(5, 100)
            price = 0
            if status in ['waiting_snabjenec_receive', 'sent_to_financier', 'archived']:
                price = random.randint(5000, 70000)
            
            products_json.append({
                "id": f"{b_type}_{p_id}",
                "name": name,
                "category": cat,
                "quantity": qty,
                "unit": unit,
                "price": price,
                "checked": status in ['waiting_snabjenec_receive', 'sent_to_financier', 'archived']
            })

        # Random creation date within last 7 days
        days_ago = random.randint(0, 7)
        created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
        
        cursor.execute("""
            INSERT INTO orders (id, branch, status, products, createdAt, supplier_responded)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (order_id, branch, status, json.dumps(products_json), created_at, 1 if status != 'review_snabjenec' else 0))

    conn.commit()
    print(f"Success! 30 orders created across {len(BRANCHES)} branches.")
    conn.close()

if __name__ == "__main__":
    reset_db()
