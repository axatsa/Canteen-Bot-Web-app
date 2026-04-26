import requests

try:
    response = requests.get('http://localhost:8000/products')
    products = response.json()
    meat_products = [p for p in products if p['category'] == '🥩 Мясо']
    print(f"Total products: {len(products)}")
    print(f"Meat products: {len(meat_products)}")
    for p in meat_products:
        print(f" - {p['name']} ({p['category']})")
except Exception as e:
    print(f"Error: {e}")
