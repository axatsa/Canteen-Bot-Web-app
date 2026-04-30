import sqlite3
import os

DB_PATH = os.getenv('DB_PATH', 'database.db')

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
        last_price REAL
    )
    ''') 
    
    # Check if last_price column exists (migration)
    try:
        cursor.execute("SELECT last_price FROM master_products LIMIT 1")
    except sqlite3.OperationalError:
        cursor.execute("ALTER TABLE master_products ADD COLUMN last_price REAL")
        conn.commit()

    # Migrate orders table: add delivery tracking columns
    existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(orders)").fetchall()}
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
    ]
    for col_name, col_def in migrations:
        if col_name not in existing_cols:
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
    products = [
        ('1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'),
        ('2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
        ('3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'),
        ('4', 'Каймак (Qaymoq)', '🥛 Молочные продукты', 'кг'),
        ('5', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты', 'кг'),
        ('6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг'),
        ('7', 'Сыр плавленый (Eritilgan pishloq)', '🥛 Молочные продукты', 'кг'),
        ('8', 'Сыр моцарелла (Motsarella pishlog‘i)', '🥛 Молочные продукты', 'кг'),
        ('9', 'Сыр Ханский (Xon pishlog‘i)', '🥛 Молочные продукты', 'кг'),
        ('10', 'Сырок (Shirin pishloqcha)', '🥛 Молочные продукты', 'шт'),
        (‘11’, ‘Сливочное масло (Sariyog\’)’, ‘🥛 Молочные продукты’, ‘кг’),
        (‘12’, ‘Маргарин «Шедрое лето» (Margarin)’, ‘🥛 Молочные продукты’, ‘кг’),
        (‘13’, ‘Яйца куриные (Tovuq tuxumi)’, ‘🥚 Яйца и мясо’, ‘шт’),
        (‘14’, ‘Яйца перепелиные (Bedana tuxumi)’, ‘🥚 Яйца и мясо’, ‘шт’),
        (‘15’, ‘Индейка (Kurka go\’shti)’, ‘🥚 Яйца и мясо’, ‘кг’),
        (‘16’, ‘Колбаса варёная (Qaynatilgan kolbasa)’, ‘🥚 Яйца и мясо’, ‘кг’),
        (‘17’, ‘Колбаса копчёная (Dudlangan kolbasa)’, ‘🥚 Яйца и мясо’, ‘кг’),
        (‘18’, ‘Сосиски (Sosiska)’, ‘🥚 Яйца и мясо’, ‘кг’),
        ('19', 'Мука (Un)', '🍞 Хлеб и мучное', 'кг'),
        ('20', 'Лаваш (Lavash non)', '🍞 Хлеб и мучное', 'шт'),
        ('21', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт'),
        ('22', 'Тостовый хлеб (Tost noni)', '🍞 Хлеб и мучное', 'шт'),
        ('23', 'Манпар (тесто) (Xamir)', '🍞 Хлеб и мучное', 'кг'),
        ('24', 'Макароны (Makaron)', '🍞 Хлеб и мучное', 'кг'),
        ('25', 'Спагетти (Spagetti)', '🍞 Хлеб и мучное', 'кг'),
        ('26', 'Вермишель (Vermishel)', '🍞 Хлеб и мучное', 'кг'),
        ('27', 'Фунчоза (Funchuza)', '🍞 Хлеб и мучное', 'кг'),
        ('28', 'Манная крупа (Manka yormasi)', '🍞 Хлеб и мучное', 'кг'),
        ('29', 'Овсянка (Suli yormasi)', '🍞 Хлеб и мучное', 'кг'),
        ('30', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг'),
        ('31', 'Рис обычный (Oddiy guruch)', '🍚 Крупы и бобовые', 'кг'),
        ('32', 'Рис Лазер (Lazer guruch)', '🍚 Крупы и бобовые', 'кг'),
        ('33', 'Перловка (Arpa yormasi)', '🍚 Крупы и бобовые', 'кг'),
        ('34', 'Нут / горох (No‘xat)', '🍚 Крупы и бобовые', 'кг'),
        ('35', 'Горох (консерва) (Konserva no‘xat)', '🍚 Крупы и бобовые', 'шт'),
        ('36', 'Соль (Tuz)', '🧂 Специи и приправы', 'кг'),
        ('37', 'Корейская соль (Koreys tuzi)', '🧂 Специи и приправы', 'кг'),
        ('38', 'Зира (Zira)', '🧂 Специи и приправы', 'г'),
        ('39', 'Приправа для лагмана (Lag‘mon ziravori)', '🧂 Специи и приправы', 'г'),
        ('40', 'Лавровый лист (Dafna bargi)', '🧂 Специи и приправы', 'шт'),
        ('41', 'Роллтон (приправа) (Rollton ziravori)', '🧂 Специи и приправы', 'шт'),
        ('42', 'Кунжут (Kunjut)', '🧂 Специи и приправы', 'г'),
        ('43', 'Какао (Kakao)', '☕ Напитки и сладкое', 'кг'),
        ('44', 'Чёрный чай (Qora choy)', '☕ Напитки и сладкое', 'кг'),
        ('45', 'Сахар (Shakar)', '☕ Напитки и сладкое', 'кг'),
        ('46', 'Варенье (Murabbo)', '☕ Напитки и сладкое', 'кг'),
        ('47', 'Шоколадная паста (Shokolad pastasi)', '☕ Напитки и сладкое', 'шт'),
        ('48', 'Миллер (вафли) (Vafli)', '☕ Напитки и сладкое', 'шт'),
        ('49', 'Изюм (Mayiz)', '☕ Напитки и сладкое', 'кг'),
        ('50', 'Грецкий орех (Yong‘oq)', '☕ Напитки и сладкое', 'кг'),
        ('51', 'Майонез (Mayonez)', '🥫 Соусы и добавки', 'кг'),
        ('52', 'Соевый соус (Soya sousi)', '🥫 Соусы и добавки', 'л'),
        ('53', 'Уксус (Sirka)', '🥫 Соусы и добавки', 'л'),
        ('54', 'Томатная паста (Tomat pastasi)', '🥫 Соусы и добавки', 'кг'),
        ('55', 'Кетчуп (Ketchup)', '🥫 Соусы и добавки', 'шт'),
        ('56', 'Масло растительное (O‘simlik yog‘i)', '🥫 Соусы и добавки', 'л'),
        ('57', 'Сода (Soda)', '🥫 Соусы и добавки', 'шт'),
        ('58', 'Дрожжи (Xamirturush)', '🥫 Соусы и добавки', 'шт'),
        ('59', 'Разрыхлитель (Pishirish kukuni)', '🥫 Соусы и добавки', 'шт'),
        ('60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
        ('61', 'Морковь красная (Qizil sabzi)', '🥕 Овощи и зелень', 'кг'),
        ('62', 'Морковь жёлтая (Sariq sabzi)', '🥕 Овощи и зелень', 'кг'),
        ('63', 'Капуста зелёная (Yashil karam)', '🥕 Овощи и зелень', 'кг'),
        ('64', 'Капуста красная (Qizil karam)', '🥕 Овощи и зелень', 'кг'),
        ('65', 'Капуста квашеная (Tuzlangan karam)', '🥕 Овощи и зелень', 'кг'),
        ('66', 'Помидоры (Pomidor)', '🥕 Овощи и зелень', 'кг'),
        ('67', 'Огурцы (Bodring)', '🥕 Овощи и зелень', 'кг'),
        ('68', 'Солёные огурцы (Tuzlangan bodring)', '🥕 Овощи и зелень', 'кг'),
        ('69', 'Болгарский перец (Bulgar qalampiri)', '🥕 Овощи и зелень', 'кг'),
        ('70', 'Болгарский перец «Светофор» (Rangli qalampir)', '🥕 Овощи и зелень', 'кг'),
        ('71', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'),
        ('72', 'Сельдерей (Selderey)', '🥕 Овощи и зелень', 'пучки'),
        ('73', 'Корейская морковь (Koreyscha sabzi)', '🥕 Овощи и зелень', 'кг'),
        ('74', 'Укроп (Shivit)', '🥕 Овощи и зелень', 'пучки'),
        ('75', 'Кинза (Kashnich)', '🥕 Овощи и зелень', 'пучки'),
        ('76', 'Свекла красная (Qizil lavlagi)', '🥕 Овощи и зелень', 'кг'),
        ('77', 'Редька белая (Oq turup)', '🥕 Овощи и зелень', 'кг'),
        ('78', 'Бананы (Banan)', '🍎 Фрукты', 'кг'),
        ('79', 'Яблоки (Olma)', '🍎 Фрукты', 'кг'),
        ('80', 'Груша (Nok)', '🍎 Фрукты', 'кг'),
        ('81', 'Лимоны (Limon)', '🍎 Фрукты', 'кг'),
        ('82', 'Мясо (Говядина)', '🥩 Мясо', 'кг'),
        ('83', 'Мясо (Баранина)', '🥩 Мясо', 'кг'),
        ('84', 'Фарш', '🥩 Мясо', 'кг'),
        ('85', 'Куриное мясо (Крылышки)', '🥩 Мясо', 'кг'),
        ('86', 'Куриное мясо (Бедро)', '🥩 Мясо', 'кг'),
        ('87', 'Куриное мясо (Филе)', '🥩 Мясо', 'кг'),
        ('88', 'Куриное мясо (Ножки)', '🥩 Мясо', 'кг'),
        ('89', 'Куриное мясо (Целая курочка)', '🥩 Мясо', 'кг'),
        ('90', 'Кости/Илик', '🥩 Мясо', 'кг'),
        ('91', 'Петрушка', '🥕 Овощи и зелень', 'пучки'),
        ('92', 'Зеленый лук', '🥕 Овощи и зелень', 'пучки'),
        ('93', 'Райхон', '🥕 Овощи и зелень', 'пучки')
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for pid, name, category, unit in products:
        # INSERT OR REPLACE handles both new items and updates to existing ones (category/unit)
        cursor.execute(
            "INSERT INTO master_products (id, name, category, unit) VALUES (?, ?, ?, ?) "
            "ON CONFLICT(id) DO UPDATE SET name=excluded.name, category=excluded.category, unit=excluded.unit",
            (pid, name, category, unit)
        )
    
    conn.commit()
    conn.close()

def seed_db():
    # Only seed if products table is empty
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM master_products")
    if cursor.fetchone()[0] == 0:
        products = [
            ('1', 'Молоко (Sut)', '🥛 Молочные продукты', 'л'),
            ('2', 'Кефир (Kefir)', '🥛 Молочные продукты', 'л'),
            ('3', 'Творог (Tvorog / Suzma)', '🥛 Молочные продукты', 'кг'),
            ('4', 'Каймак (Qaymoq)', '🥛 Молочные продукты', 'кг'),
            ('5', 'Сметана (Smetana / Qaymoqcha)', '🥛 Молочные продукты', 'кг'),
            ('6', 'Сыр твёрдый (Qattiq pishloq)', '🥛 Молочные продукты', 'кг'),
            ('7', 'Сыр плавленый (Eritilgan pishloq)', '🥛 Молочные продукты', 'кг'),
            ('8', 'Сыр моцарелла (Motsarella pishlog‘i)', '🥛 Молочные продукты', 'кг'),
            ('9', 'Сыр Ханский (Xon pishlog‘i)', '🥛 Молочные продукты', 'кг'),
            ('10', 'Сырок (Shirin pishloqcha)', '🥛 Молочные продукты', 'шт'),
            ('11', 'Сливочное масло (Sariyog‘)', '🥛 Молочные продукты', 'кг'),
            ('12', 'Маргарин «Шедрое лето» (Margarin)', '🥛 Молочные продукты', 'кг'),
            ('13', 'Яйца куриные (Tovuq tuxumi)', '🥚 Яйца', 'шт'),
            ('14', 'Яйца перепелиные (Bedana tuxumi)', '🥚 Яйца', 'шт'),
            ('15', 'Индейка (Kurka go‘shti)', '🥩 Мясо', 'кг'),
            ('16', 'Колбаса варёная (Qaynatilgan kolbasa)', '🥩 Мясо', 'кг'),
            ('17', 'Колбаса копчёная (Dudlangan kolbasa)', '🥩 Мясо', 'кг'),
            ('18', 'Сосиски (Sosiska)', '🥩 Мясо', 'кг'),
            ('19', 'Мука (Un)', '🍞 Хлеб и мучное', 'кг'),
            ('20', 'Лаваш (Lavash non)', '🍞 Хлеб и мучное', 'шт'),
            ('21', 'Хлеб (Non)', '🍞 Хлеб и мучное', 'шт'),
            ('22', 'Тостовый хлеб (Tost noni)', '🍞 Хлеб и мучное', 'шт'),
            ('23', 'Манпар (тесто) (Xamir)', '🍞 Хлеб и мучное', 'кг'),
            ('24', 'Макароны (Makaron)', '🍞 Хлеб и мучное', 'кг'),
            ('25', 'Спагетти (Spagetti)', '🍞 Хлеб и мучное', 'кг'),
            ('26', 'Вермишель (Vermishel)', '🍞 Хлеб и мучное', 'кг'),
            ('27', 'Фунчоза (Funchuza)', '🍞 Хлеб и мучное', 'кг'),
            ('28', 'Манная крупа (Manka yormasi)', '🍞 Хлеб и мучное', 'кг'),
            ('29', 'Овсянка (Suli yormasi)', '🍞 Хлеб и мучное', 'кг'),
            ('30', 'Рис (Guruch)', '🍚 Крупы и бобовые', 'кг'),
            ('31', 'Рис обычный (Oddiy guruch)', '🍚 Крупы и бобовые', 'кг'),
            ('32', 'Рис Лазер (Lazer guruch)', '🍚 Крупы и бобовые', 'кг'),
            ('33', 'Перловка (Arpa yormasi)', '🍚 Крупы и бобовые', 'кг'),
            ('34', 'Нут / горох (No‘xat)', '🍚 Крупы и бобовые', 'кг'),
            ('35', 'Горох (консерва) (Konserva no‘xat)', '🍚 Крупы и бобовые', 'шт'),
            ('36', 'Соль (Tuz)', '🧂 Специи и приправы', 'кг'),
            ('37', 'Корейская соль (Koreys tuzi)', '🧂 Специи и приправы', 'кг'),
            ('38', 'Зира (Zira)', '🧂 Специи и приправы', 'г'),
            ('39', 'Приправа для лагмана (Lag‘mon ziravori)', '🧂 Специи и приправы', 'г'),
            ('40', 'Лавровый лист (Dafna bargi)', '🧂 Специи и приправы', 'шт'),
            ('41', 'Роллтон (приправа) (Rollton ziravori)', '🧂 Специи и приправы', 'шт'),
            ('42', 'Кунжут (Kunjut)', '🧂 Специи и приправы', 'г'),
            ('43', 'Какао (Kakao)', '☕ Напитки и сладкое', 'кг'),
            ('44', 'Чёрный чай (Qora choy)', '☕ Напитки и сладкое', 'кг'),
            ('45', 'Сахар (Shakar)', '☕ Напитки и сладкое', 'кг'),
            ('46', 'Варенье (Murabbo)', '☕ Напитки и сладкое', 'кг'),
            ('47', 'Шоколадная паста (Shokolad pastasi)', '☕ Напитки и сладкое', 'шт'),
            ('48', 'Миллер (вафли) (Vafli)', '☕ Напитки и сладкое', 'шт'),
            ('49', 'Изюм (Mayiz)', '☕ Напитки и сладкое', 'кг'),
            ('50', 'Грецкий орех (Yong‘oq)', '☕ Напитки и сладкое', 'кг'),
            ('51', 'Майонез (Mayonez)', '🥫 Соусы и добавки', 'кг'),
            ('52', 'Соевый соус (Soya sousi)', '🥫 Соусы и добавки', 'л'),
            ('53', 'Уксус (Sirka)', '🥫 Соусы и добавки', 'л'),
            ('54', 'Томатная паста (Tomat pastasi)', '🥫 Соусы и добавки', 'кг'),
            ('55', 'Кетчуп (Ketchup)', '🥫 Соусы и добавки', 'шт'),
            ('56', 'Масло растительное (O‘simlik yog‘i)', '🥫 Соусы и добавки', 'л'),
            ('57', 'Сода (Soda)', '🥫 Соусы и добавки', 'шт'),
            ('58', 'Дрожжи (Xamirturush)', '🥫 Соусы и добавки', 'шт'),
            ('59', 'Разрыхлитель (Pishirish kukuni)', '🥫 Соусы и добавки', 'шт'),
            ('60', 'Картофель (Kartoshka)', '🥕 Овощи и зелень', 'кг'),
            ('61', 'Морковь красная (Qizil sabzi)', '🥕 Овощи и зелень', 'кг'),
            ('62', 'Морковь жёлтая (Sariq sabzi)', '🥕 Овощи и зелень', 'кг'),
            ('63', 'Капуста зелёная (Yashil karam)', '🥕 Овощи и зелень', 'кг'),
            ('64', 'Капуста красная (Qizil karam)', '🥕 Овощи и зелень', 'кг'),
            ('65', 'Капуста квашеная (Tuzlangan karam)', '🥕 Овощи и зелень', 'кг'),
            ('66', 'Помидоры (Pomidor)', '🥕 Овощи и зелень', 'кг'),
            ('67', 'Огурцы (Bodring)', '🥕 Овощи и зелень', 'кг'),
            ('68', 'Солёные огурцы (Tuzlangan bodring)', '🥕 Овощи и зелень', 'кг'),
            ('69', 'Болгарский перец (Bulgar qalampiri)', '🥕 Овощи и зелень', 'кг'),
            ('70', 'Болгарский перец «Светофор» (Rangli qalampir)', '🥕 Овощи и зелень', 'кг'),
            ('71', 'Лук (Piyoz)', '🥕 Овощи и зелень', 'кг'),
            ('72', 'Сельдерей (Selderey)', '🥕 Овощи и зелень', 'пучки'),
            ('73', 'Корейская морковь (Koreyscha sabzi)', '🥕 Овощи и зелень', 'кг'),
            ('74', 'Укроп (Shivit)', '🥕 Овощи и зелень', 'пучки'),
            ('75', 'Кинза (Kashnich)', '🥕 Овощи и зелень', 'пучки'),
            ('76', 'Свекла красная (Qizil lavlagi)', '🥕 Овощи и зелень', 'кг'),
            ('77', 'Редька белая (Oq turup)', '🥕 Овощи и зелень', 'кг'),
            ('78', 'Бананы (Banan)', '🍎 Фрукты', 'кг'),
            ('79', 'Яблоки (Olma)', '🍎 Фрукты', 'кг'),
            ('80', 'Груша (Nok)', '🍎 Фрукты', 'кг'),
            ('81', 'Лимоны (Limon)', '🍎 Фрукты', 'кг'),
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
        cursor.executemany("INSERT INTO master_products (id, name, category, unit) VALUES (?, ?, ?, ?)", products)
        conn.commit()

    conn.close()
