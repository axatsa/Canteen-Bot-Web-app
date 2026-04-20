"""
Verify API response shapes match frontend/src/lib/api.ts expectations.
api.ts getOrders() maps: createdAt, deliveredAt, estimatedDeliveryDate → new Date(...)
So they MUST be ISO strings.
"""
import re

ISO_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}")

SAMPLE_ORDER = {
    "id": "contract-1",
    "status": "sent_to_chef",
    "products": [],
    "createdAt": "2026-04-20T10:00:00",
    "branch": "uchtepa_land",
    "supplierResponded": False,
    "deliveryTracking": {},
    "extraItemsDelivered": {},
}


def test_order_createdAt_is_string(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    order = resp.json()[0]
    assert isinstance(order["createdAt"], str), "createdAt must be string for new Date()"
    assert ISO_PATTERN.match(order["createdAt"]), "createdAt must be ISO format"


def test_order_branch_is_valid(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    order = resp.json()[0]
    valid_branches = {
        "beltepa_land", "uchtepa_land", "rakat_land", "mukumiy_land",
        "yunusabad_land", "novoi_land", "novza_school", "uchtepa_school",
        "almazar_school", "general_uzakov_school", "namangan_school", "novoi_school",
    }
    assert order["branch"] in valid_branches


def test_order_products_is_list(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    order = resp.json()[0]
    assert isinstance(order["products"], list)


def test_order_delivery_tracking_is_dict(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    order = resp.json()[0]
    assert isinstance(order["deliveryTracking"], dict)
    assert isinstance(order["extraItemsDelivered"], dict)


def test_order_supplier_responded_is_bool(client):
    client.post("/orders/upsert", json=SAMPLE_ORDER)
    resp = client.get("/orders")
    order = resp.json()[0]
    assert isinstance(order["supplierResponded"], bool)


def test_products_lastPrice_field(client):
    """api.ts Product type has lastPrice (camelCase)."""
    resp = client.get("/products")
    data = resp.json()
    assert len(data) > 0
    assert "lastPrice" in data[0]
