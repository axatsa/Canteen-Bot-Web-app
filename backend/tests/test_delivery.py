SAMPLE_ORDER = {
    "id": "order-delivery-1",
    "status": "waiting_snabjenec_receive",
    "products": [{"id": "p1", "name": "Молоко", "category": "🥛 Молочные продукты",
                  "quantity": 10, "unit": "л"}],
    "createdAt": "2026-04-20T10:00:00",
    "branch": "novza_school",
    "supplierResponded": False,
    "deliveryTracking": {},
    "extraItemsDelivered": {},
    "chefName": "TestChef",
    "snabjenecName": "TestSnabjenec",
}


def _create_order(client):
    client.post("/orders/upsert?role=snabjenec&user_name=TestSnabjenec&branch=novza_school", json=SAMPLE_ORDER)


def test_mark_supplier_received(client):
    _create_order(client)
    resp = client.post(
        "/orders/order-delivery-1/mark_supplier_received",
        json={"received_date": "2026-04-20"}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["supplier_responded"] is True


def test_mark_supplier_received_404(client):
    resp = client.post(
        "/orders/nonexistent/mark_supplier_received",
        json={"received_date": "2026-04-20"}
    )
    assert resp.status_code == 404


def test_update_delivery(client):
    _create_order(client)
    resp = client.post(
        "/orders/order-delivery-1/update_delivery",
        json={
            "delivery_tracking": {
                "p1": {"ordered_qty": 10, "received_qty": 8, "status": "partial"}
            },
            "extra_items": {}
        }
    )
    assert resp.status_code == 200


def test_archive_order(client):
    _create_order(client)
    resp = client.post(
        "/orders/order-delivery-1/archive",
        json={"archived_by": "snabjenec"}
    )
    assert resp.status_code == 200
    assert resp.json()["status_new"] == "archived"


def test_archive_order_404(client):
    resp = client.post("/orders/ghost/archive", json={"archived_by": "snabjenec"})
    assert resp.status_code == 404
