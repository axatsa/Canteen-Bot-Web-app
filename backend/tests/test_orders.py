import json

SAMPLE_ORDER = {
    "id": "test-order-1",
    "status": "sent_to_chef",
    "products": [],
    "createdAt": "2026-04-20T10:00:00",
    "branch": "beltepa_land",
    "supplierResponded": False,
    "deliveryTracking": {},
    "extraItemsDelivered": {},
    "chefName": "TestChef",
}


def test_get_orders_empty_initially(client):
    resp = client.get("/orders?role=chef&user_name=TestChef")
    assert resp.status_code == 200
    assert resp.json() == []


def test_upsert_order_creates_order(client):
    resp = client.post("/orders/upsert?role=chef&user_name=TestChef&branch=beltepa_land", json=SAMPLE_ORDER)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"


def test_get_orders_returns_upserted_order(client):
    client.post("/orders/upsert?role=chef&user_name=TestChef&branch=beltepa_land", json=SAMPLE_ORDER)
    resp = client.get("/orders?role=chef&user_name=TestChef")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == "test-order-1"
    assert data[0]["status"] == "sent_to_chef"
    assert data[0]["branch"] == "beltepa_land"


def test_upsert_order_updates_existing(client):
    client.post("/orders/upsert?role=chef&user_name=TestChef&branch=beltepa_land", json=SAMPLE_ORDER)
    updated = {**SAMPLE_ORDER, "status": "review_snabjenec"}
    client.post("/orders/upsert?role=chef&user_name=TestChef&branch=beltepa_land", json=updated)
    resp = client.get("/orders?role=chef&user_name=TestChef")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["status"] == "review_snabjenec"


def test_order_has_frontend_contract_fields(client):
    client.post("/orders/upsert?role=chef&user_name=TestChef&branch=beltepa_land", json=SAMPLE_ORDER)
    resp = client.get("/orders?role=chef&user_name=TestChef")
    order = resp.json()[0]
    assert "id" in order
    assert "status" in order
    assert "products" in order
    assert "createdAt" in order
    assert "branch" in order
    assert "supplierResponded" in order
    assert "deliveryTracking" in order
    assert "extraItemsDelivered" in order
