import sqlite3
import os

DB_PATH = os.getenv('DB_PATH', 'db/database.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        telegram_id INTEGER UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL,
        branch TEXT,
        language TEXT DEFAULT 'ru',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Orders table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        status TEXT NOT NULL,
        products TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        deliveredAt TEXT,
        estimatedDeliveryDate TEXT,
        branch TEXT NOT NULL
    )
    ''')
    
    # Products table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS master_products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT NOT NULL,
        last_price REAL,
        branch_type TEXT
    )
    ''') 
    
    # Check if last_price and branch_type columns exist (migration)
    existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(master_products)").fetchall()}
    if "last_price" not in existing_cols:
        cursor.execute("ALTER TABLE master_products ADD COLUMN last_price REAL")
    if "branch_type" not in existing_cols:
        cursor.execute("ALTER TABLE master_products ADD COLUMN branch_type TEXT")
    conn.commit()

    # Migrate orders table: add delivery tracking columns
    existing_orders_cols = {row[1] for row in cursor.execute("PRAGMA table_info(orders)").fetchall()}
    migrations = [
        ("sent_to_supplier_at", "TEXT"),
        ("received_from_supplier_at", "TEXT"),
        ("delivery_tracking", "TEXT DEFAULT '{}'"),
        ("supplier_responded", "INTEGER DEFAULT 0"),
        ("extra_items_delivered", "TEXT DEFAULT '{}'"),
        ("chef_name", "TEXT"),
        ("snabjenec_name", "TEXT"),
        ("supplier_name", "TEXT"),
        ("sent_to_meat_supplier", "INTEGER DEFAULT 0"),
        ("sent_to_product_supplier", "INTEGER DEFAULT 0"),
        ("archived_by", "TEXT"),
        ("archived_at", "TEXT"),
        ("sent_to_financier_at", "TEXT"),
    ]
    for col_name, col_def in migrations:
        if col_name not in existing_orders_cols:
            cursor.execute(f"ALTER TABLE orders ADD COLUMN {col_name} {col_def}")
    conn.commit()

    # Templates table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT
    )
    ''')

    # Export history table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS export_history (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        template_id TEXT,
        format TEXT,
        file_name TEXT,
        exported_by TEXT,
        exported_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (template_id) REFERENCES templates(id)
    )
    ''')

    # Auto-migrate products (ensure all items from the list exist)
    migrate_products()

    conn.commit()
    conn.close()

def migrate_products():
    """Ensures all products in the seed list exist in the database and updates their categories/units if needed."""
    
    land_products = [
        ('land_1', 'Молоко (Sut)', '🥛 Молочные продукты и жиры', 'л', 'land'),
        ('land_2', 'Кефир (Kefir)', '🥛 Молочные продукты и жиры', 'л', 'land'),
        ('land_3', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_4', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_5', 'Каймак (Qaymoq)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_6', 'Сухое молоко (Quruq sut)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_7', 'Сыр Самарканд (Samarqand pishlog‘i)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_8', 'Сыр творожный (Tvorogli pishloq)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_9', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_10', 'Сыр плавленый (Eritilgan pishloq)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_11', 'Сыр моцарелла (Motsarella pishlog‘i)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_12', 'Брынза (Brynza pishlog‘i)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_13', 'Масло сливочное (Sariyog‘)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_14', 'Масло растительное (O‘simlik yog‘i)', '🥛 Молочные продукты и жиры', 'л', 'land'),
        ('land_15', 'Маргарин (Margarin)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_16', 'Маргарин «Шедрое лето» (Margarin)', '🥛 Молочные продукты и жиры', 'кг', 'land'),
        ('land_17', 'Яйца куриные (Tovuq tuxumi)', '🥚 Яйца', 'шт', 'land'),
        ('land_18', 'Яйца перепелиные (Bedana tuxumi)', '🥚 Яйца', 'шт', 'land'),
        ('land_19', 'Рис лазер (Lazer guruch)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_20', 'Рис аланга (Alanga guruch)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_21', 'Манная крупа (Manka yormasi)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_22', 'Овсянка (Suli yormasi)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_23', 'Гречка (Grechka)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_24', 'Чечевица (Yasmiq)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_25', 'Нут/Горох (No‘xat)', '🍚 Крупы и бобовые', 'кг', 'land'),
        ('land_26', 'Кукуруза (Makkajo‘xori)', '🍚 Крупы и бобовые', 'шт', 'land'),
        ('land_27', 'Горошек (Yashil no‘xat)', '🍚 Крупы и бобовые', 'шт', 'land'),
        ('land_28', 'Макароны (Makaron)', '🍝 Макароны и мука', 'кг', 'land'),
        ('land_29', 'Спагетти (Spagetti)', '🍝 Макароны и мука', 'кг', 'land'),
        ('land_30', 'Вермишель (Vermishel)', '🍝 Макароны и мука', 'кг', 'land'),
        ('land_31', 'Фунчоза (Funchuza)', '🍝 Макароны и мука', 'кг', 'land'),
        ('land_32', 'Мука (Un)', '🍝 Макароны и мука', 'кг', 'land'),
        ('land_33', 'Панировка (Non kukuni)', '🍝 Макароны и мука', 'кг', 'land'),
        ('land_34', 'Хлеб (Non)', '🍞 Хлеб и выпечка', 'шт', 'land'),
        ('land_35', 'Лаваш (Lavash non)', '🍞 Хлеб и выпечка', 'шт', 'land'),
        ('land_36', 'Бумага для кексов (Keks qog‘ozi)', '🍞 Хлеб и выпечка', 'шт', 'land'),
        ('land_37', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_38', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_39', 'Морковь красная (Qizil sabzi)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_40', 'Морковь жёлтая (Sariq sabzi)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_41', 'Капуста белокочанная (Oq karam)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_42', 'Капуста краснокочанная (Qizil karam)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_43', 'Свёкла (Lavlagi)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_44', 'Помидоры (Pomidor)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_45', 'Огурцы (Bodring)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_46', 'Болгарский перец (Bulgar qalampiri)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_47', 'Болгарский перец (светофор) (Rangli qalampir)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_48', 'Чеснок (Sarimsoq)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_49', 'Редька (Turup)', '🥕 Овощи и зелень', 'кг', 'land'),
        ('land_50', 'Сельдерей (Selderey)', '🥕 Овощи и зелень', 'пучки', 'land'),
        ('land_51', 'Кинза (Kashnich)', '🥕 Овощи и зелень', 'пучки', 'land'),
        ('land_52', 'Укроп (Shivit)', '🥕 Овощи и зелень', 'пучки', 'land'),
        ('land_53', 'Листья салата (Salat bargi)', '🥕 Овощи и зелень', 'пучки', 'land'),
        ('land_54', 'Оливки (Zaytun)', '🥕 Овощи и зелень', 'шт', 'land'),
        ('land_55', 'Банан (Banan)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_56', 'Яблоко (Olma)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_57', 'Апельсин (Apelsin)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_58', 'Киви (Kivi)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_59', 'Лимон (Limon)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_60', 'Сухофрукты (Quritilgan mevalar)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_61', 'Изюм (Mayiz)', '🍎 Фрукты и сухофрукты', 'кг', 'land'),
        ('land_62', 'Соль (Tuz)', '🧂 Специи и приправы', 'кг', 'land'),
        ('land_63', 'Каменная соль (Tosh tuzi)', '🧂 Специи и приправы', 'кг', 'land'),
        ('land_64', 'Китайская соль (Xitoy tuzi)', '🧂 Специи и приправы', 'кг', 'land'),
        ('land_65', 'Зира (Zira)', '🧂 Специи и приправы', 'г', 'land'),
        ('land_66', 'Приправа «Роллтон» (Rollton ziravori)', '🧂 Специи и приправы', 'шт', 'land'),
        ('land_67', 'Ванилин (Vanilin)', '🧂 Специи и приправы', 'г', 'land'),
        ('land_68', 'Седана (кунжут/пряность) (Kunjut ziravori)', '🧂 Специи и приправы', 'г', 'land'),
        ('land_69', 'Майонез (Mayonez)', '🥫 Соусы и добавки', 'кг', 'land'),
        ('land_70', 'Томатная паста (Tomat pastasi)', '🥫 Соусы и добавки', 'кг', 'land'),
        ('land_71', 'Уксус (Sirka)', '🥫 Соусы и добавки', 'л', 'land'),
        ('land_72', 'Сахар (Shakar)', '☕ Напитки и сладкое', 'кг', 'land'),
        ('land_73', 'Шоколад (Shokolad)', '☕ Напитки и сладкое', 'кг', 'land'),
        ('land_74', 'Какао (Kakao)', '☕ Напитки и сладкое', 'кг', 'land'),
        ('land_75', 'Кисель (Kisel)', '☕ Напитки и сладкое', 'кг', 'land'),
        ('land_76', 'Разрыхлитель (Pishirish kukuni)', '🧁 Для выпечки', 'шт', 'land'),
        ('land_77', 'Сода (Soda)', '🧁 Для выпечки', 'шт', 'land'),
        ('land_78', 'Дрожжи (Xamirturush)', '🧁 Для выпечки', 'шт', 'land'),
        ('land_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг', 'land'),
        ('land_mutton', 'Мясо (Баранина)', '🥩 Мясо', 'кг', 'land'),
        ('land_mince', 'Фарш', '🥩 Мясо', 'кг', 'land'),
        ('land_chicken_wings', 'Куриное мясо (Крылышки)', '🥩 Мясо', 'кг', 'land'),
        ('land_chicken_thighs', 'Куриное мясо (Бедро)', '🥩 Мясо', 'кг', 'land'),
        ('land_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг', 'land'),
        ('land_chicken_legs', 'Куриное мясо (Ножки)', '🥩 Мясо', 'кг', 'land'),
        ('land_chicken_whole', 'Куриное мясо (Целая курочка)', '🥩 Мясо', 'кг', 'land'),
        ('land_bones', 'Кости/Илик', '🥩 Мясо', 'кг', 'land'),
    ]

    school_products = [
        ('school_1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л', 'school'),
        ('school_2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л', 'school'),
        ('school_3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_4', 'Каймак (Qaymoq)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_5', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_7', 'Сыр плавленый (Eritilgan pishloq)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_8', 'Сыр моцарелла (Motsarella pishlog‘i)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_9', 'Сыр Ханский (Xon pishlog‘i)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_10', 'Сырок (Shirin pishloqcha)', '🥛 Молочные продукты', 'шт', 'school'),
        ('school_11', 'Сливочное масло (Sariyog‘)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_12', 'Маргарин «Шедрое лето» (Margarin)', '🥛 Молочные продукты', 'кг', 'school'),
        ('school_13', 'Яйца куриные (Tovuq tuxumi)', '🥚 Яйца и мясо', 'шт', 'school'),
        ('school_14', 'Яйца перепелиные (Bedana tuxumi)', '🥚 Яйца и мясо', 'шт', 'school'),
        ('school_15', 'Индейка (Kurka go‘shti)', '🥩 Мясо', 'кг', 'school'),
        ('school_16', 'Колбаса варёная (Qaynatilgan kolbasa)', '🥩 Мясо', 'кг', 'school'),
        ('school_17', 'Колбаса копчёная (Dudlangan kolbasa)', '🥩 Мясо', 'кг', 'school'),
        ('school_18', 'Сосиски (Sosiska)', '🥩 Мясо', 'кг', 'school'),
        ('school_19', 'Мука (Un)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_20', 'Лаваш (Lavash non)', '🍞 Хлеб и мучное', 'шт', 'school'),
        ('school_21', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт', 'school'),
        ('school_22', 'Тостовый хлеб (Tost noni)', '🍞 Хлеб и мучное', 'шт', 'school'),
        ('school_23', 'Манпар (тесто) (Xamir)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_24', 'Макароны (Makaron)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_25', 'Спагетти (Spagetti)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_26', 'Вермишель (Vermishel)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_27', 'Фунчоза (Funchuza)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_28', 'Манная крупа (Manka yormasi)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_29', 'Овсянка (Suli yormasi)', '🍞 Хлеб и мучное', 'кг', 'school'),
        ('school_30', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг', 'school'),
        ('school_31', 'Рис обычный (Oddiy guruch)', '🍚 Крупы и бобовые', 'кг', 'school'),
        ('school_32', 'Рис Лазер (Lazer guruch)', '🍚 Крупы и бобовые', 'кг', 'school'),
        ('school_33', 'Перловка (Arpa yormasi)', '🍚 Крупы и бобовые', 'кг', 'school'),
        ('school_34', 'Нут / горох (No‘xat)', '🍚 Крупы и бобовые', 'кг', 'school'),
        ('school_35', 'Горох (консерва) (Konserva no‘xat)', '🍚 Крупы и бобовые', 'шт', 'school'),
        ('school_36', 'Соль (Tuz)', '🧂 Специи и приправы', 'кг', 'school'),
        ('school_37', 'Корейская соль (Koreys tuzi)', '🧂 Специи и приправы', 'кг', 'school'),
        ('school_38', 'Зира (Zira)', '🧂 Специи и приправы', 'г', 'school'),
        ('school_39', 'Приправа для лагмана (Lag‘mon ziravori)', '🧂 Специи и приправы', 'г', 'school'),
        ('school_40', 'Лавровый лист (Dafna bargi)', '🧂 Специи и приправы', 'шт', 'school'),
        ('school_41', 'Роллтон (приправа) (Rollton ziravori)', '🧂 Специи и приправы', 'шт', 'school'),
        ('school_42', 'Кунжут (Kunjut)', '🧂 Специи и приправы', 'г', 'school'),
        ('school_43', 'Какао (Kakao)', '☕ Напитки и сладкое', 'кг', 'school'),
        ('school_44', 'Чёрный чай (Qora choy)', '☕ Напитки и сладкое', 'кг', 'school'),
        ('school_45', 'Сахар (Shakar)', '☕ Напитки и сладкое', 'кг', 'school'),
        ('school_46', 'Варенье (Murabbo)', '☕ Напитки и сладкое', 'кг', 'school'),
        ('school_47', 'Шоколадная паста (Shokolad pastasi)', '☕ Напитки и сладкое', 'шт', 'school'),
        ('school_48', 'Миллер (вафли) (Vafli)', '☕ Напитки и сладкое', 'шт', 'school'),
        ('school_49', 'Изюм (Mayiz)', '☕ Напитки и сладкое', 'кг', 'school'),
        ('school_50', 'Грецкий орех (Yong‘oq)', '☕ Напитки и сладкое', 'кг', 'school'),
        ('school_51', 'Майонез (Mayonez)', '🥫 Соусы и добавки', 'кг', 'school'),
        ('school_52', 'Соевый соус (Soya sousi)', '🥫 Соусы и добавки', 'л', 'school'),
        ('school_53', 'Уксус (Sirka)', '🥫 Соусы и добавки', 'л', 'school'),
        ('school_54', 'Томатная паста (Tomat pastasi)', '🥫 Соусы и добавки', 'кг', 'school'),
        ('school_55', 'Кетчуп (Ketchup)', '🥫 Соусы и добавки', 'шт', 'school'),
        ('school_56', 'Масло растительное (O‘simlik yog‘i)', '🥫 Соусы и добавки', 'л', 'school'),
        ('school_57', 'Сода (Soda)', '🥫 Соусы и добавки', 'шт', 'school'),
        ('school_58', 'Дрожжи (Xamirturush)', '🥫 Соусы и добавки', 'шт', 'school'),
        ('school_59', 'Разрыхлитель (Pishirish kukuni)', '🥫 Соусы и добавки', 'шт', 'school'),
        ('school_60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_61', 'Морковь красная (Qizil sabzi)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_62', 'Морковь жёлтая (Sariq sabzi)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_63', 'Капуста зелёная (Yashil karam)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_64', 'Капуста красная (Qizil karam)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_65', 'Капуста квашеная (Tuzlangan karam)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_66', 'Помидоры (Pomidor)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_67', 'Огурцы (Bodring)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_68', 'Солёные огурцы (Tuzlangan bodring)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_69', 'Болгарский перец (Bulgar qalampiri)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_70', 'Болгарский перец «Светофор» (Rangli qalampir)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_71', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_72', 'Сельдерей (Selderey)', '🥕 Овощи и зелень', 'пучки', 'school'),
        ('school_73', 'Корейская морковь (Koreyscha sabzi)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_74', 'Укруп (Shivit)', '🥕 Овощи и зелень', 'пучки', 'school'),
        ('school_75', 'Кинза (Kashnich)', '🥕 Овощи и зелень', 'пучки', 'school'),
        ('school_76', 'Свекла красная (Qizil lavlagi)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_77', 'Редька белая (Oq turup)', '🥕 Овощи и зелень', 'кг', 'school'),
        ('school_78', 'Бананы (Banan)', '🍎 Фрукты', 'кг', 'school'),
        ('school_79', 'Яблоки (Olma)', '🍎 Фрукты', 'кг', 'school'),
        ('school_80', 'Груша (Nok)', '🍎 Фрукты', 'кг', 'school'),
        ('school_81', 'Лимоны (Limon)', '🍎 Фрукты', 'кг', 'school'),
        ('school_beef', 'Мясо (Говядина)', '🥩 Мясо', 'кг', 'school'),
        ('school_mutton', 'Мясо (Баранина)', '🥩 Мясо', 'кг', 'school'),
        ('school_mince', 'Фарш', '🥩 Мясо', 'кг', 'school'),
        ('school_chicken_wings', 'Куриное мясо (Крылышки)', '🥩 Мясо', 'кг', 'school'),
        ('school_chicken_thighs', 'Куриное мясо (Бедро)', '🥩 Мясо', 'кг', 'school'),
        ('school_chicken_fillet', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг', 'school'),
        ('school_chicken_legs', 'Куриное мясо (Ножки)', '🥩 Мясо', 'кг', 'school'),
        ('school_chicken_whole', 'Куриное мясо (Целая курочка)', '🥩 Мясо', 'кг', 'school'),
        ('school_bones', 'Кости/Илик', '🥩 Мясо', 'кг', 'school'),
    ]

    all_products = land_products + school_products
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for pid, name, category, unit, btype in all_products:
        cursor.execute(
            "INSERT INTO master_products (id, name, category, unit, branch_type) VALUES (?, ?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit, branch_type=excluded.branch_type",
            (pid, name, category, unit, btype)
        )
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()

def seed_db():
    init_db()
