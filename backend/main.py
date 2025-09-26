import datetime
from fastapi import FastAPI, HTTPException, Query
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = MongoClient("mongodb://admin_user:web3@mongo:27017/")
database = client.practica1
collection_historial = database.historial

# --- Helpers ---
def validate_numbers(numbers: List[float]):
    if any(n < 0 for n in numbers):
        raise HTTPException(status_code=400, detail="No se permiten números negativos")

def save_operation(op: str, numbers: List[float], result: float):
    document = {
        "operation": op,
        "numbers": numbers,
        "result": result,
        "date": datetime.datetime.now(tz=datetime.timezone.utc)
    }
    collection_historial.insert_one(document)
    return document

# --- Operaciones ---
@app.get("/calculator/{op}")
def calculate(op: str, numbers: List[float] = Query(...)):
    validate_numbers(numbers)

    if op == "sum":
        result = sum(numbers)
    elif op == "sub":
        result = numbers[0]
        for n in numbers[1:]:
            result -= n
    elif op == "mul":
        result = 1
        for n in numbers:
            result *= n
    elif op == "div":
        result = numbers[0]
        for n in numbers[1:]:
            if n == 0:
                raise HTTPException(status_code=403, detail="División entre cero no permitida")
            result /= n
    else:
        raise HTTPException(status_code=404, detail="Operación no soportada")

    doc = save_operation(op, numbers, result)
    return {"operation": op, "numbers": numbers, "result": result, "date": doc["date"]}

# --- Historial con filtros ---
@app.get("/calculator/history")
def obtain_history(
    op: Optional[str] = None,
    sort_by: str = "date",
    order: str = "desc",
    limit: int = Query(10, ge=1, le=100)  # valor por defecto
):
    query = {}
    if op:
        query["operation"] = op

    sort_order = -1 if order == "desc" else 1
    records = collection_historial.find(query).sort(sort_by, sort_order).limit(limit)

    history = []
    for record in records:
        history.append({
            "operation": record.get("operation"),
            "numbers": record.get("numbers"),
            "result": record.get("result"),
            "date": record["date"].isoformat() if "date" in record else None
        })

    return {"history": history}
