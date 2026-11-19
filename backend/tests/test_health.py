import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check_returns_200():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "formation-damage-api"
    assert data["model_loaded"] is True
    assert data["model_version"] == "1.0.0"

def test_root_ping():
    response = client.get("/")
    assert response.status_code == 200
    assert "Formation Damage Simulator API" in response.json()["message"]
