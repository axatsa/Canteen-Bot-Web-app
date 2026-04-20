def test_get_products_returns_list(client):
    resp = client.get("/products")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)


def test_get_products_has_required_fields(client):
    resp = client.get("/products")
    data = resp.json()
    assert len(data) > 0
    product = data[0]
    assert "id" in product
    assert "name" in product
    assert "category" in product
    assert "unit" in product
    assert "quantity" in product
