import sqlite3
import json
import os
import random
from datetime import datetime, timedelta

DB_PATH = 'database.db' 
if not os.path.exists(DB_PATH):
    DB_PATH = 'db/database.db'

# --- EXACT COPIED FROM database.py ---
LAND_PRODUCTS = [
    ('land_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'), ('land_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
    ('land_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'), ('land_4', 'Каймак (Qaymoq)', '🥛 Молочные продукты', 'кг'),
    ('land_5', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты', 'кг'), ('land_6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг'),
    ('land_7', 'Сыр плавленый (Eritilgan pishloq)', '🥛 Молочные продукты', 'кг'), ('land_8', 'Сливочное масло (Sariyog‘)', '🥛 Молочные продукты', 'кг'),
    ('land_9', 'Маргарин «Шедрое лето» (Margarin)', '🥛 Молочные продукты', 'кг'), ('land_10', 'Яйцо куриное (Tovuq tuxumi)', '🥚 Яйца', 'шт'),
    ('land_11', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг'), ('land_12', 'Гречка (Grechka)', '🍚 Крупы и бобовые', 'кг'),
    ('land_13', 'Горох (No‘xat)', '🍚 Крупы и бобовые', 'кг'), ('land_14', 'Маш (Mosh)', '🍚 Крупы и бобовые', 'кг'),
    ('land_15', 'Овсяная крупа (Suli yormasi)', '🍚 Крупы и бобовые', 'кг'), ('land_16', 'Манная крупа (Manka yormasi)', '🍚 Крупы и бобовые', 'кг'),
    ('land_17', 'Пшеничная крупа (Bug‘doy yormasi)', '🍚 Крупы и бобовые', 'кг'), ('land_18', 'Растительное масло (Paxta yog‘i)', '🥫 Соусы и добавки', 'л'),
    ('land_19', 'Подсолнечное масло (Ochirilgan yog‘)', '🥫 Соусы и добавки', 'л'), ('land_20', 'Томатная паста (Tomat pastasi)', '🥫 Соусы и добавки', 'кг'),
    ('land_21', 'Уксус (Sirka)', '🥫 Соусы и добавки', 'л'), ('land_22', 'Мука (Un)', '🍝 Макароны и мука', 'кг'),
    ('land_23', 'Макароны (Makaron)', '🍝 Макароны и мука', 'кг'), ('land_24', 'Хлеб (Non)', '🍞 Хлеб и выпечка', 'шт'),
    ('land_25', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'), ('land_26', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'),
    ('land_27', 'Морковь красная (Qizil sabzi)', '🥕 Овощи и зелень', 'кг'), ('land_28', 'Помидоры (Pomidor)', '🥕 Овощи и зелень', 'кг'),
    ('land_29', 'Огурцы (Bodring)', '🥕 Овощи и зелень', 'кг'), ('land_bee_f', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('land_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг'), ('land_bones', 'Кости/Илик', '🥩 Мясо', 'кг'),
]

SCHOOL_PRODUCTS = [
    ('school_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л', 'school'),
    ('school_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л', 'school'),
    ('school_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг', 'school'),
    ('school_11', 'Сливочное масло (Sariyog‘)', '🥛 Молочные продукты', 'кг', 'school'),
    ('school_13', 'Яйца куриные (Tovuq tuxumi)', '🥚 Яйца и мясо', 'шт', 'school'),
    ('school_21', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт', 'school'),
    ('school_23', 'Манпар (тесто) (Xamir)', '🍞 Хлеб и мучное', 'кг', 'school'),
    ('school_24', 'Макароны (Makaron)', '🍞 Хлеб и мучное', 'кг', 'school'),
    ('school_30', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг', 'school'),
    ('school_60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг', 'school'),
    ('school_71', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг', 'school'),
    ('school_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг', 'school'),
    ('school_chicken_whole', 'Куриное мясо (Целая курочка)', '🥩 Мясо', 'кг', 'school'),
]

def reset_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM master_products")
    try: cursor.execute("DELETE FROM delivery_tracking")
    except: pass
    
    # Seeding EXACTLY as in original database.py
    for p in LAND_PRODUCTS:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)", (p[0], p[1], p[2], p[3], 5000, 'land'))
    for p in SCHOOL_PRODUCTS:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)", (p[0], p[1], p[2], p[3], 5000, 'school'))

    BRANCHES = ['beltepa_land', 'novza_school', 'uchtepa_school']
    STATUSES = ['sent_to_supplier', 'waiting_snabjenec_receive', 'sent_to_financier', 'archived']

    print("Generating 30 high-fidelity test orders...")
    for i in range(30):
        order_id = f"test_order_gen_{i+1}"
        branch = random.choice(BRANCHES)
        status = random.choice(STATUSES)
        b_type = 'school' if 'school' in branch else 'land'
        pool = SCHOOL_PRODUCTS if b_type == 'school' else LAND_PRODUCTS
        
        meat_pool = [p for p in pool if '🥩 Мясо' in p[2]]
        prod_pool = [p for p in pool if '🥩 Мясо' not in p[2]]
        
        rand_val = random.random()
        if rand_val < 0.3: selected = random.sample(meat_pool, min(2, len(meat_pool)))
        elif rand_val < 0.6: selected = random.sample(prod_pool, min(4, len(prod_pool)))
        else: selected = random.sample(pool, min(5, len(pool)))

        products_json = []
        tracking_json = {}
        for p in selected:
            ordered_qty = random.randint(10, 80)
            price = random.randint(10000, 45000)
            products_json.append({"id": p[0], "name": p[1], "category": p[2], "quantity": ordered_qty, "unit": p[3], "price": price, "checked": True})
            
            if status in ['sent_to_financier', 'archived', 'waiting_snabjenec_receive']:
                tracking_json[p[0]] = {"ordered_qty": ordered_qty, "received_qty": ordered_qty, "price_at_delivery": price}

        created_at = (datetime.now() - timedelta(days=random.randint(0, 15))).isoformat()
        cursor.execute("INSERT INTO orders (id, branch, status, products, createdAt, supplier_responded, delivery_tracking) VALUES (?, ?, ?, ?, ?, ?, ?)",
                       (order_id, branch, status, json.dumps(products_json), created_at, 1, json.dumps(tracking_json)))
    
    conn.commit()
    print("Restore successful. Exact strings from database.py used.")
    conn.close()

if __name__ == "__main__":
    reset_db()
