import sqlite3
import json
import uuid
import random
from datetime import datetime, timedelta

def seed_data():
    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Get master products
    cursor.execute("SELECT id, name, category, unit FROM master_products")
    master_products = cursor.fetchall()
    if not master_products:
        print("Error: No master products found. Run migrations first.")
        return

    branches = [
        'beltepa_land', 'uchtepa_land', 'rakat_land', 'mukumiy_land', 'yunusabad_land', 'novoi_land',
        'novza_school', 'uchtepa_school', 'almazar_school', 'general_uzakov_school', 'namangan_school', 'novoi_school'
    ]

    statuses = [
        'sent_to_chef', 'review_snabjenec', 'sent_to_supplier', 
        'waiting_snabjenec_receive', 'sent_to_financier', 'archived'
    ]

    names = ['Азамат', 'Тимур', 'Сардор', 'Джахонгир', 'Мадина', 'Лола']

    print("Seeding 100 orders...")

    for i in range(100):
        order_id = str(uuid.uuid4())
        status = random.choice(statuses)
        branch = random.choice(branches)
        
        # Random products for this order (3 to 10 products)
        selected_prods = random.sample(master_products, random.randint(3, 10))
        order_products = []
        delivery_tracking = {}
        
        total_ordered = 0
        total_received = 0

        for p in selected_prods:
            qty = random.randint(5, 50)
            total_ordered += qty
            order_products.append({
                "id": str(p[0]),
                "name": p[1],
                "category": p[2],
                "unit": p[3],
                "quantity": qty,
                "price": random.randint(5000, 50000)
            })

            # For statuses past supplier, add tracking
            if status in ['waiting_snabjenec_receive', 'sent_to_financier', 'archived']:
                received = qty if random.random() > 0.2 else random.randint(0, qty)
                total_received += received
                delivery_tracking[str(p[0])] = {
                    "ordered_qty": qty,
                    "received_qty": received,
                    "status": "delivered" if received == qty else "partial" if received > 0 else "not_delivered"
                }

        # Date within last 30 days
        created_at = datetime.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
        created_at_str = created_at.isoformat()

        cursor.execute('''
            INSERT INTO orders (
                id, status, products, createdAt, branch, 
                delivery_tracking, chef_name, snabjenec_name, supplier_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            order_id,
            status,
            json.dumps(order_products),
            created_at_str,
            branch,
            json.dumps(delivery_tracking),
            random.choice(names),
            random.choice(names),
            "Premium Food LLC"
        ))

    conn.commit()
    conn.close()
    print("Successfully seeded 100 orders.")

if __name__ == "__main__":
    seed_data()
