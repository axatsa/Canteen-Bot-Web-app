import sqlite3
import json
import os
from datetime import datetime

DB_PATH = 'database.db'

LAND_PRODUCTS = [
    # (id, name, cat, unit, type)
    ('land_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг', 'land'),
    ('land_mutton', 'Мясо (Баранина)', '🥩 Мясо', 'кг', 'land'),
    ('land_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг', 'land'),
    ('land_milk', 'Молоко (Sut)', '🥛 Молочные продукты', 'л', 'land'),
    ('land_kefir', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л', 'land'),
    ('land_potato', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг', 'land'),
    ('land_onion', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг', 'land'),
]

SCHOOL_PRODUCTS = [
    ('school_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг', 'school'),
    ('school_chicken', 'Куриное мясо (Целая)', '🥩 Мясо', 'кг', 'school'),
    ('school_milk', 'Молоко (Sut)', '🥛 Молочные продукты', 'л', 'school'),
    ('school_bread', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт', 'school'),
    ('school_potato', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг', 'school'),
]

def reset_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Cleaning database...")
    cursor.execute("DELETE FROM orders")
    cursor.execute("DELETE FROM master_products")
    # Table might not exist yet
    try:
        cursor.execute("DELETE FROM delivery_tracking")
    except:
        pass
    
    print("Seeding master_products...")
    all_p = LAND_PRODUCTS + SCHOOL_PRODUCTS
    for p_id, name, cat, unit, p_type in all_p:
        cursor.execute("""
            INSERT INTO master_products (id, name, category, unit, last_price, branch_type)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (p_id, name, cat, unit, 5000, p_type))

    # Test Orders for Beltepa-Land
    # 1. Meat Order
    meat_products = [
        {"id": "land_beef", "name": "Мясо (Говядина)", "category": "🥩 Мясо", "quantity": 10.5, "unit": "кг", "price": 0},
        {"id": "land_chicken_fillet", "name": "Куриное мясо (Филе)", "category": "🥩 Мясо", "quantity": 5.0, "unit": "кг", "price": 0}
    ]
    cursor.execute("""
        INSERT INTO orders (id, branch, status, products, createdAt)
        VALUES (?, ?, ?, ?, ?)
    """, ("test_meat_land", "beltepa_land", "sent_to_supplier", json.dumps(meat_products), datetime.now().isoformat()))

    # 2. Products Order
    prod_products = [
        {"id": "land_milk", "name": "Молоко (Sut)", "category": "🥛 Молочные продукты", "quantity": 20, "unit": "л", "price": 0},
        {"id": "land_potato", "name": "Картофель (Kartoshka)", "category": "🥕 Овощи и зелень", "quantity": 50, "unit": "кг", "price": 0}
    ]
    cursor.execute("""
        INSERT INTO orders (id, branch, status, products, createdAt)
        VALUES (?, ?, ?, ?, ?)
    """, ("test_prod_land", "beltepa_land", "sent_to_supplier", json.dumps(prod_products), datetime.now().isoformat()))

    conn.commit()
    print("Database reset and seeded with split test orders!")
    conn.close()

if __name__ == "__main__":
    reset_db()
