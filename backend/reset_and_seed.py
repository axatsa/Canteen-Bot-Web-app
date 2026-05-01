import sqlite3
import json
import uuid
import random
import os
from datetime import datetime, timedelta

def reset_and_seed():
    # Use DB_PATH from environment or default to database.db
    db_path = os.getenv('DB_PATH', 'database.db')
    
    if not os.path.exists(db_path):
        # Try a common fallback for local testing if run from root
        if os.path.exists('backend/database.db'):
            db_path = 'backend/database.db'

    print(f"Connecting to database at: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print("Cleaning orders and history...")
        cursor.execute("DELETE FROM orders")
        cursor.execute("DELETE FROM export_history")
        conn.commit()

        # Get master products
        cursor.execute("SELECT id, name, category, unit FROM master_products")
        master_products = cursor.fetchall()
        if not master_products:
            print("Error: No master products found. Run migrations first.")
            conn.close()
            return

        meat_products = [p for p in master_products if p[2] == '🥩 Мясо']
        other_products = [p for p in master_products if p[2] != '🥩 Мясо']

        branches = [
            'beltepa_land', 'uchtepa_land', 'rakat_land', 'mukumiy_land', 'yunusabad_land', 'novoi_land',
            'novza_school', 'uchtepa_school', 'almazar_school', 'general_uzakov_school', 'namangan_school', 'novoi_school'
        ]

        statuses = [
            'sent_to_chef', 'review_snabjenec', 'sent_to_supplier', 
            'waiting_snabjenec_receive', 'sent_to_financier', 'archived'
        ]

        names = ['Азамат', 'Тимур', 'Сардор', 'Джахонгир', 'Мадина', 'Лола']

        print("Seeding 25 diverse orders...")

        for i in range(25):
            order_id = str(uuid.uuid4())
            status = random.choice(statuses)
            branch = random.choice(branches)
            
            comp_type = random.choice(['meat_only', 'products_only', 'mixed'])
            if comp_type == 'meat_only':
                selected_prods = random.sample(meat_products, min(len(meat_products), random.randint(2, 5)))
            elif comp_type == 'products_only':
                selected_prods = random.sample(other_products, random.randint(3, 8))
            else:
                selected_prods = random.sample(meat_products, random.randint(1, 3)) + \
                                 random.sample(other_products, random.randint(2, 5))

            order_products = []
            delivery_tracking = {}
            
            for p in selected_prods:
                qty = round(random.uniform(5, 50), 2)
                price = random.randint(10000, 100000)
                order_products.append({
                    "id": str(p[0]),
                    "name": p[1],
                    "category": p[2],
                    "unit": p[3],
                    "quantity": qty,
                    "price": price
                })

                if status in ['waiting_snabjenec_receive', 'sent_to_financier', 'archived']:
                    received = qty if random.random() > 0.3 else round(random.uniform(0, qty), 2)
                    delivery_tracking[str(p[0])] = {
                        "ordered_qty": qty,
                        "received_qty": received,
                        "status": "delivered" if received == qty else "partial" if received > 0 else "not_delivered"
                    }

            created_at = datetime.now() - timedelta(days=random.randint(0, 10))
            created_at_str = created_at.isoformat()
            
            sent_to_financier_at = None
            if status in ['sent_to_financier', 'archived']:
                sent_to_financier_at = (created_at + timedelta(days=1)).isoformat()

            cursor.execute('''
                INSERT INTO orders (
                    id, status, products, createdAt, branch, 
                    delivery_tracking, chef_name, snabjenec_name, supplier_name,
                    sent_to_financier_at, sent_to_meat_supplier, sent_to_product_supplier
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                order_id,
                status,
                json.dumps(order_products),
                created_at_str,
                branch,
                json.dumps(delivery_tracking),
                random.choice(names),
                random.choice(names),
                "Global Food & Meat Co." if status != 'sent_to_chef' else None,
                sent_to_financier_at,
                1 if comp_type in ['meat_only', 'mixed'] and status != 'sent_to_chef' else 0,
                1 if comp_type in ['products_only', 'mixed'] and status != 'sent_to_chef' else 0
            ))

        conn.commit()
        conn.close()
        print("Successfully seeded 25 orders.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_and_seed()
