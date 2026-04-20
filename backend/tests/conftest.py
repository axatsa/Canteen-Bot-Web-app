import pytest
from fastapi.testclient import TestClient
import backend.app.database as db_module
from backend.app.database import init_db, seed_db
from backend.app.api import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_file = str(tmp_path / "test.db")
    monkeypatch.setattr(db_module, "DB_PATH", db_file)
    init_db()
    seed_db()
    with TestClient(app) as c:
        yield c
