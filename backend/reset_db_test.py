import sqlite3
import json
import os
import random
from datetime import datetime, timedelta

DB_PATH = 'database.db' 
if not os.path.exists(DB_PATH):
    DB_PATH = 'db/database.db'

# --- FULL ORIGINAL LISTS ---
LAND_PRODUCTS_FULL = [
    ('land_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'),
    ('land_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
    ('land_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'),
    ('land_4', 'Каймак (Qaymoq)', '🥛 Молочные продукты', 'кг'),
    ('land_5', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты', 'кг'),
    ('land_6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг'),
    ('land_7', 'Сыр плавленый (Eritilgan pishloq)', '🥛 Молочные продукты', 'кг'),
    ('land_8', 'Сливочное масло (Sariyog‘)', '🥛 Молочные продукты', 'кг'),
    ('land_9', 'Маргарин «Шедрое лето» (Margarin)', '🥛 Молочные продукты', 'кг'),
    ('land_10', 'Яйцо куриное (Tovuq tuxumi)', '🥚 Яйца', 'шт'),
    ('land_11', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг'),
    ('land_12', 'Гречка (Grechka)', '🍚 Крупы и бобовые', 'кг'),
    ('land_13', 'Горох (No‘xat)', '🍚 Крупы и бобовые', 'кг'),
    ('land_14', 'Маш (Mosh)', '🍚 Крупы и бобовые', 'кг'),
    ('land_15', 'Овсяная крупа (Suli yormasi)', '🍚 Крупы и бобовые', 'кг'),
    ('land_16', 'Манная крупа (Manka yormasi)', '🍚 Крупы и бобовые', 'кг'),
    ('land_17', 'Пшеничная крупа (Bug‘doy yormasi)', '🍚 Крупы и бобовые', 'кг'),
    ('land_18', 'Растительное масло (Paxta yog‘i)', '🥫 Соусы и добавки', 'л'),
    ('land_19', 'Подсолнечное масло (Ochirilgan yog‘)', '🥫 Соусы и добавки', 'л'),
    ('land_20', 'Томатная паста (Tomat pastasi)', '🥫 Соусы и добавки', 'кг'),
    ('land_21', 'Уксус (Sirka)', '🥫 Соусы и добавки', 'л'),
    ('land_22', 'Мука (Un)', '🍝 Макароны и мука', 'кг'),
    ('land_23', 'Макароны (Makaron)', '🍝 Макароны и мука', 'кг'),
    ('land_24', 'Хлеб (Non)', '🍞 Хлеб и выпечка', 'шт'),
    ('land_25', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
    ('land_26', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'),
    ('land_27', 'Морковь красная (Qizil sabzi)', '🥕 Овощи и зелень', 'кг'),
    ('land_28', 'Помидоры (Pomidor)', '🥕 Овощи и зелень', 'кг'),
    ('land_29', 'Огурцы (Bodring)', '🥕 Овощи и зелень', 'кг'),
    ('land_30', 'Яблоко (Olma)', '🍎 Фрукты и сухофрукты', 'кг'),
    ('land_31', 'Банан (Banan)', '🍎 Фрукты и сухофрукты', 'кг'),
    ('land_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('land_mutton', 'Мясо (Баранина)', '🥩 Мясо', 'кг'),
    ('land_mince', 'Фарш', '🥩 Мясо', 'кг'),
    ('land_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг'),
    ('land_chicken_whole', 'Курица (Целая)', '🥩 Мясо', 'кг'),
]

SCHOOL_PRODUCTS_FULL = [
    ('school_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'),
    ('school_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
    ('school_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'),
    ('school_6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг'),
    ('school_11', 'Сливочное масло (Sariyog‘)', '🥛 Молочные продукты', 'кг'),
    ('school_13', 'Яйца куриные (Tovuq tuxumi)', '🥚 Яйца и мясо', 'шт'),
    ('school_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
    ('school_mutton', 'Мясо (Баранина)', '🥩 Мясо', 'кг'),
    ('school_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг'),
    ('school_19', 'Мука (Un)', '🍞 Хлеб и мучное', 'кг'),
    ('school_20', 'Лаваш (Lavash non)', '🍞 Хлеб и мучное', 'шт'),
    ('school_21', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт'),
    ('school_24', 'Макароны (Makaron)', '🍞 Хлеб и мучное', 'кг'),
    ('school_30', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг'),
    ('school_60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
    ('school_71', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'),
    ('school_78', 'Бананы (Banan)', '🍎 Фрукты', 'кг'),
    ('school_79', 'Яблоки (Olma)', '🍎 Фрукты', 'кг'),
]

def reset_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Cleaning database...")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM master_products")
    try: cursor.execute("DELETE FROM delivery_tracking")
    except: pass
    
    print("Seeding FULL master_products...")
    for p_id, name, cat, unit in LAND_PRODUCTS_FULL:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)",
                       (p_id, name, cat, unit, random.randint(5000, 80000), 'land'))
    
    for p_id, name, cat, unit in SCHOOL_PRODUCTS_FULL:
        cursor.execute("INSERT INTO master_products (id, name, category, unit, last_price, branch_type) VALUES (?, ?, ?, ?, ?, ?)",
                       (p_id, name, cat, unit, random.randint(5000, 80000), 'school'))

    BRANCHES = ['beltepa_land', 'uchtepa_land', 'novza_school', 'uchtepa_school']
    STATUSES = ['review_snabjenec', 'sent_to_supplier', 'waiting_snabjenec_receive', 'sent_to_financier', 'archived']

    print("Generating 30 random orders...")
    for i in range(30):
        order_id = f"test_order_{i+1}"
        branch = random.choice(BRANCHES)
        status = random.choice(STATUSES)
        b_type = 'school' if 'school' in branch else 'land'
        pool = SCHOOL_PRODUCTS_FULL if b_type == 'school' else LAND_PRODUCTS_FULL
        
        # Split meat and products
        meat_pool = [p for p in pool if '🥩 Мясо' in p[2]]
        prod_pool = [p for p in pool if '🥩 Мясо' not in p[2]]
        
        rand_val = random.random()
        selected = []
        if rand_val < 0.3: selected = random.sample(meat_pool, min(2, len(meat_pool)))
        elif rand_val < 0.6: selected = random.sample(prod_pool, min(5, len(prod_pool)))
        else: selected = random.sample(pool, min(6, len(pool)))

        products_json = []
        for p_id, name, cat, unit in selected:
            products_json.append({
                "id": p_id, "name": name, "category": cat, "quantity": random.randint(5, 50), "unit": unit,
                "price": random.randint(5000, 70000) if status != 'review_snabjenec' else 0,
                "checked": status in ['waiting_snabjenec_receive', 'sent_to_financier', 'archived']
            })

        created_at = (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat()
        cursor.execute("INSERT INTO orders (id, branch, status, products, createdAt, supplier_responded) VALUES (?, ?, ?, ?, ?, ?)",
                       (order_id, branch, status, json.dumps(products_json), created_at, 1 if status != 'review_snabjenec' else 0))

    conn.commit()
    print("Restore complete! FULL lists are back.")
    conn.close()

if __name__ == "__main__":
    reset_db()
