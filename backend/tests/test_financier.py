ORDERS = [
    {
        "id": f"fin-order-{i}",
        "status": status,
        "products": [{"id": "p1", "name": "Молоко", "category": "🥛 Молочные продукты",
                      "quantity": 5, "unit": "л", "price": 10000}],
        "createdAt": "2026-04-20T10:00:00",
        "branch": branch,
        "supplierResponded": False,
        "deliveryTracking": {},
        "extraItemsDelivered": {},
    }
    for i, (status, branch) in enumerate([
        ("sent_to_financier", "beltepa_land"),
        ("sent_to_supplier", "novza_school"),
        ("archived", "beltepa_land"),
    ])
]


def _seed(client):
    for o in ORDERS:
        client.post("/orders/upsert", json=o)


def test_financier_all_orders(client):
    _seed(client)
    resp = client.get("/orders/financier/all")
    assert resp.status_code == 200
    data = resp.json()
    assert "orders" in data
    assert len(data["orders"]) >= 1


def test_financier_all_orders_branch_filter(client):
    _seed(client)
    resp = client.get("/orders/financier/all?branch=beltepa_land")
    assert resp.status_code == 200
    orders = resp.json()["orders"]
    for o in orders:
        assert o["branch"] == "beltepa_land"


def test_financier_statistics(client):
    _seed(client)
    resp = client.get("/orders/financier/statistics")
    assert resp.status_code == 200
    data = resp.json()
    assert "summary" in data


def test_financier_archive(client):
    _seed(client)
    resp = client.get("/orders/financier/archive")
    assert resp.status_code == 200
    data = resp.json()
    assert "archived_orders" in data


def test_financier_order_details(client):
    _seed(client)
    resp = client.get("/orders/fin-order-0/financier/details")
    assert resp.status_code == 200
    data = resp.json()
    # Response is nested: {"order": {"id": ..., ...}, "delivery": {...}, ...}
    assert "order" in data
    assert "id" in data["order"]


def test_financier_order_details_404(client):
    resp = client.get("/orders/nonexistent/financier/details")
    assert resp.status_code == 404
