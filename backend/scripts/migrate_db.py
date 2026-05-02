import sqlite3
import os

DB_PATH = 'backend/database.db'

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database {DB_PATH} not found. Skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Updating existing greens units...")
    cursor.execute("UPDATE master_products SET unit = 'пучки' WHERE id IN ('72', '74', '75')")
    
    print("Updating eggs and existing meat categories...")
    cursor.execute("UPDATE master_products SET category = '🥚 Яйца и мясо' WHERE id IN ('13', '14', '15', '16', '17', '18')")

    print("Adding new meat products...")
    new_products = [
        ('82', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
        ('83', 'Мясо (Баранина)', '🥩 Мясо', 'кг'),
        ('84', 'Фарш', '🥩 Мясо', 'кг'),
        ('85', 'Куриное мясо (Крылышки)', '🥩 Мясо', 'кг'),
        ('86', 'Куриное мясо (Бедро)', '🥩 Мясо', 'кг'),
        ('87', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг'),
        ('88', 'Куриное мясо (Ножки)', '🥩 Мясо', 'кг'),
        ('89', 'Куриное мясо (Целая курочка)', '🥩 Мясо', 'кг'),
        ('90', 'Кости/Илик', '🥩 Мясо', 'кг')
    ]
    
    for pid, name, cat, unit in new_products:
        cursor.execute("INSERT OR REPLACE INTO master_products (id, name, category, unit) VALUES (?, ?, ?, ?)", (pid, name, cat, unit))

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
