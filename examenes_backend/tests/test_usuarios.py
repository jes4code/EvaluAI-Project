from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_registro_usuario():
    payload = {
        "email": "nuevo@ejemplo.com",
        "nombre": "Nuevo Usuario",
        "password": "segura123"
    }
    response = client.post("/usuarios/registro", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "mensaje" in data

def test_login_usuario():
    payload = {
        "email": "nuevo@ejemplo.com",
        "password": "segura123"
    }
    response = client.post("/usuarios/login", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "usuario" in data
    assert data["mensaje"] == "Login exitoso"
