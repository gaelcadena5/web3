import pytest
import mongomock
from fastapi.testclient import TestClient
import main

client = TestClient(main.app)

# Crear base de datos mock
mongo_client = mongomock.MongoClient()
database = mongo_client.practica1
mock_collection = database.historial

# Parchar la colección antes de cada test
@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    monkeypatch.setattr(main, "collection_historial", mock_collection)
    mock_collection.delete_many({})

# --- SUM ---
def test_sum_basic():
    response = client.post("/calculator/sum", json={"numbers": [2, 3]})
    assert response.status_code == 200
    assert response.json()["result"] == 5

def test_sum_large_numbers():
    response = client.post("/calculator/sum", json={"numbers": [1e10, 2e10]})
    assert response.status_code == 200
    assert response.json()["result"] == 3e10

def test_sum_negative_number():
    response = client.post("/calculator/sum", json={"numbers": [-1, 2]})
    assert response.status_code == 400
    assert "No se permiten números negativos" in response.json()["detail"]["error"]

def test_sum_insufficient_numbers():
    response = client.post("/calculator/sum", json={"numbers": [5]})
    assert response.status_code == 400
    assert "Se requieren al menos 2 números" in response.json()["detail"]["error"]

# --- SUB ---
def test_sub_basic():
    response = client.post("/calculator/sub", json={"numbers": [10, 4]})
    assert response.status_code == 200
    assert response.json()["result"] == 6

def test_sub_multiple():
    response = client.post("/calculator/sub", json={"numbers": [20, 5, 3]})
    assert response.status_code == 200
    assert response.json()["result"] == 12

def test_sub_negative_input():
    response = client.post("/calculator/sub", json={"numbers": [10, -2]})
    assert response.status_code == 400
    assert "No se permiten números negativos" in response.json()["detail"]["error"]

def test_sub_single_number():
    response = client.post("/calculator/sub", json={"numbers": [10]})
    assert response.status_code == 400
    assert "Se requieren al menos 2 números" in response.json()["detail"]["error"]

# --- MUL ---
def test_mul_basic():
    response = client.post("/calculator/mul", json={"numbers": [2, 3]})
    assert response.status_code == 200
    assert response.json()["result"] == 6

def test_mul_with_zero():
    response = client.post("/calculator/mul", json={"numbers": [5, 0]})
    assert response.status_code == 200
    assert response.json()["result"] == 0

def test_mul_negative_input():
    response = client.post("/calculator/mul", json={"numbers": [3, -1]})
    assert response.status_code == 400
    assert "No se permiten números negativos" in response.json()["detail"]["error"]

def test_mul_single_number():
    response = client.post("/calculator/mul", json={"numbers": [7]})
    assert response.status_code == 400
    assert "Se requieren al menos 2 números" in response.json()["detail"]["error"]

# --- DIV ---
def test_div_basic():
    response = client.post("/calculator/div", json={"numbers": [10, 2]})
    assert response.status_code == 200
    assert response.json()["result"] == 5

def test_div_multiple():
    response = client.post("/calculator/div", json={"numbers": [100, 2, 5]})
    assert response.status_code == 200
    assert response.json()["result"] == 10

def test_div_by_zero():
    response = client.post("/calculator/div", json={"numbers": [10, 0]})
    assert response.status_code == 403
    assert "División entre cero no permitida" in response.json()["detail"]["error"]

def test_div_negative_input():
    response = client.post("/calculator/div", json={"numbers": [10, -2]})
    assert response.status_code == 400
    assert "No se permiten números negativos" in response.json()["detail"]["error"]

# --- HISTORIAL ---
def test_history_default():
    mock_collection.insert_one({
        "operation": "sum",
        "numbers": [1, 2],
        "result": 3,
        "date": main.datetime.datetime.now(tz=main.datetime.timezone.utc)
    })
    response = client.get("/calculator/history")
    assert response.status_code == 200
    assert len(response.json()["history"]) == 1

def test_history_filter_by_operation():
    mock_collection.insert_many([
        {"operation": "sum", "numbers": [1, 2], "result": 3, "date": main.datetime.datetime.now(tz=main.datetime.timezone.utc)},
        {"operation": "mul", "numbers": [2, 3], "result": 6, "date": main.datetime.datetime.now(tz=main.datetime.timezone.utc)}
    ])
    response = client.get("/calculator/history?operation=mul")
    assert response.status_code == 200
    assert len(response.json()["history"]) == 1
    assert response.json()["history"][0]["operation"] == "mul"

def test_history_invalid_operation():
    response = client.get("/calculator/history?operation=invalid")
    assert response.status_code == 400
    assert "Operación no válida" in response.json()["detail"]["error"]

def test_history_limit():
    for i in range(15):
        mock_collection.insert_one({
            "operation": "sum",
            "numbers": [i, i],
            "result": i + i,
            "date": main.datetime.datetime.now(tz=main.datetime.timezone.utc)
        })
    response = client.get("/calculator/history?limit=5")
    assert response.status_code == 200
    assert len(response.json()["history"]) == 5

def test_history_order_desc():
    mock_collection.insert_many([
        {"operation": "sum", "numbers": [1, 2], "result": 3, "date": main.datetime.datetime(2025, 1, 1, tzinfo=main.datetime.timezone.utc)},
        {"operation": "sum", "numbers": [3, 4], "result": 7, "date": main.datetime.datetime(2025, 1, 2, tzinfo=main.datetime.timezone.utc)}
    ])
    response = client.get("/calculator/history?order=desc")
    assert response.json()["history"][0]["result"] == 7


# --- BATCH ---
def test_batch_operations_success():
    response = client.post("/calculator/batch", json={
        "operations": [
            {"op": "sum", "nums": [1, 2]},
            {"op": "mul", "nums": [3, 4]}
        ]
    })
    assert response.status_code == 200
    assert response.json() == [
        {"op": "sum", "result": 3},
        {"op": "mul", "result": 12}
    ]

def test_batch_invalid_operation():
    response = client.post("/calculator/batch", json={
        "operations": [
            {"op": "pow", "nums": [2, 3]}
        ]
    })
    assert response.status_code == 400
    assert "Operación no soportada" in response.json()["detail"]["error"]

def test_batch_negative_numbers():
    response = client.post("/calculator/batch", json={
        "operations": [
            {"op": "sum", "nums": [-1, 2]}
        ]
    })
    assert response.status_code == 400
    assert "No se permiten números negativos" in response.json()["detail"]["error"]

def test_batch_division_by_zero():
    response = client.post("/calculator/batch", json={
        "operations": [
            {"op": "div", "nums": [10, 0]}
        ]
    })
    assert response.status_code == 403
    assert "División entre cero no permitida" in response.json()["detail"]["error"]

