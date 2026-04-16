import sys
import os
import uuid
import random
from datetime import datetime, timedelta

# Настраиваем пути, чтобы скрипт видел папку app
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))
sys.path.append(os.path.dirname(__file__))

from app import crud, database

def seed():
    database.init_db()
    print("🔍 Получаем список продуктов из базы...")
    products = crud.get_all_products()
    if not products:
        print("❌ База продуктов пуста! Сначала добавьте продукты через админку.")
        return

    # Возьмем первые 10 продуктов для тестов
    base_products = products[:10]
    branches = ['chilanzar', 'uchtepa', 'shayzantaur', 'olmazar']
    
    print("\n🚀 Создаем 4 тестовые заявки в разных статусах для проверки ролей:\n")

    # ==========================================
    # 1. ЗАЯВКА ТОЛЬКО ОТ ШЕФА (Ждет проверки Снабженцем)
    # ==========================================
    order1_products = []
    for p in base_products[:4]:
        product = p.copy()
        product['quantity'] = random.randint(5, 20)
        order1_products.append(product)
        
    order1 = {
        "id": str(uuid.uuid4()),
        "status": "review_snabjenec",
        "createdAt": datetime.now().isoformat(),
        "deliveredAt": None,
        "estimatedDeliveryDate": None,
        "branch": branches[0],
        "products": order1_products
    }
    
    # ==========================================
    # 2. СНАБЖЕНЕЦ ОТПРАВИЛ ЕЕ ПОСТАВЩИКУ (Поставщик видит ее)
    # ==========================================
    order2_products = []
    for p in base_products[2:6]:
        product = p.copy()
        product['quantity'] = random.randint(10, 50)
        product['chefComment'] = "Нужно срочно"
        order2_products.append(product)
        
    order2 = {
        "id": str(uuid.uuid4()),
        "status": "sent_to_supplier",
        "createdAt": (datetime.now() - timedelta(hours=1)).isoformat(),
        "deliveredAt": None,
        "estimatedDeliveryDate": None,
        "branch": branches[1],
        "products": order2_products
    }
    
    # ==========================================
    # 3. ПОСТАВЩИК ПРОСТАВИЛ ЦЕНЫ И ОТПРАВИЛ (Ждет приемки Снабженцем)
    # ==========================================
    order3_products = []
    for p in base_products[5:9]:
        product = p.copy()
        product['quantity'] = random.randint(5, 15)
        product['price'] = random.randint(5, 50) * 1000
        # Делаем так, что половина товаров еще не отмечена как полученная (received: False)
        product['received'] = random.choice([True, False])
        if not product['received']:
            # Ожидается довоз завтра
            product['expectedDate'] = "Завтра до обеда"
        else:
            product['expectedDate'] = None

        order3_products.append(product)
        
    order3 = {
        "id": str(uuid.uuid4()),
        "status": "waiting_snabjenec_receive",
        "createdAt": (datetime.now() - timedelta(hours=2)).isoformat(),
        "deliveredAt": None,
        "estimatedDeliveryDate": (datetime.now() + timedelta(days=1)).isoformat(),
        "branch": branches[2],
        "products": order3_products
    }

    # ==========================================
    # 4. СНАБЖЕНЕЦ ВСЕ ПРИНЯЛ -> ФИНАНСИСТ (Ждет финального утверждения архива)
    # ==========================================
    order4_products = []
    for p in base_products[1:6]:
        product = p.copy()
        product['quantity'] = random.randint(10, 30)
        product['price'] = random.randint(10, 80) * 1000
        # У финансиста все товары ВСЕГДА отмечены как принятые
        product['received'] = True 
        product['expectedDate'] = None
        order4_products.append(product)
        
    order4 = {
        "id": str(uuid.uuid4()),
        "status": "sent_to_financier",
        "createdAt": (datetime.now() - timedelta(days=1)).isoformat(),
        "deliveredAt": datetime.now().isoformat(),
        "estimatedDeliveryDate": datetime.now().isoformat(),
        "branch": branches[3],
        "products": order4_products
    }

    # Сохраняем в базу
    orders_to_create = [
        (order1, "1️⃣ >> ШЕФ -> Снабженец (Статус: review_snabjenec)"),
        (order2, "2️⃣ >> Снабженец -> Поставщик (Статус: sent_to_supplier)"),
        (order3, "3️⃣ >> Поставщик -> Снабженец (Приемка, Статус: waiting_snabjenec_receive)"),
        (order4, "4️⃣ >> Снабженец -> Финансист (Готово, Статус: sent_to_financier)")
    ]

    for order, label in orders_to_create:
        success = crud.upsert_order(order)
        if success:
            print(f"✅ Добавлено: {label} [Филиал: {order['branch']}]")
        else:
            print(f"❌ Ошибка добавления: {label}")

    print("\n🎉 Успех! Теперь зайдите в Frontend (или Telegram Mini App) под разными ролями, чтобы проверить их интерфейсы.")

if __name__ == "__main__":
    seed()
