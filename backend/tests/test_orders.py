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
}


def test_get_orders_empty_initially(client):
    resp = client.get("/orders")
    assert resp.status_code == 200
    assert resp.json() == []


def test_upsert_order_creates_order(client):
    resp = client.post("/orders/upsert", json=SAMPLE_ORDER)
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"


def test_get_orders_returns_upserted_order(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["id"] == "test-order-1"
    assert data[0]["status"] == "sent_to_chef"
    assert data[0]["branch"] == "beltepa_land"


def test_upsert_order_updates_existing(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    updated = {**SAMPLE_ORDER, "status": "sent_to_supplier"}
    client.post("/orders/upsert", json=updated)
    resp = client.get("/orders")
    data = resp.json()
    assert len(data) == 1
    assert data[0]["status"] == "sent_to_supplier"


def test_order_has_frontend_contract_fields(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    order = resp.json()[0]
    assert "id" in order
    assert "status" in order
    assert "products" in order
    assert "createdAt" in order
    assert "branch" in order
    assert "supplierResponded" in order
    assert "deliveryTracking" in order
    assert "extraItemsDelivered" in order
