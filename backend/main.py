import datetime
from datetime import timedelta
from typing import List, Optional

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conexión MongoDB (docker-compose)
client = MongoClient("mongodb://admin_user:web3@mongo:27017/")
database = client.practica1
collection_historial = database.historial

# Modelo de entrada: lista de números
class OperationInput(BaseModel):
    numbers: List[float]

# Validaciones
def validate_numbers(numbers: List[float]):
    if any(n < 0 for n in numbers):
        raise HTTPException(
            status_code=400,
            detail={"error": "No se permiten números negativos", "numbers": numbers},
        )
    if len(numbers) < 2:
        raise HTTPException(
            status_code=400,
            detail={"error": "Se requieren al menos 2 números", "numbers": numbers},
        )

# Guardar en historial
def save_history(operation: str, numbers: List[float], result: float):
    document = {
        "operation": operation,
        "numbers": numbers,
        "result": result,
        "date": datetime.datetime.now(tz=datetime.timezone.utc),
    }
    collection_historial.insert_one(document)

# Operaciones
@app.post("/calculator/sum")
def sum_numbers(data: OperationInput):
    validate_numbers(data.numbers)
    result = sum(data.numbers)
    save_history("sum", data.numbers, result)
    return {"operation": "sum", "numbers": data.numbers, "result": result}

@app.post("/calculator/sub")
def sub_numbers(data: OperationInput):
    validate_numbers(data.numbers)
    result = data.numbers[0]
    for n in data.numbers[1:]:
        result -= n
    save_history("sub", data.numbers, result)
    return {"operation": "sub", "numbers": data.numbers, "result": result}

@app.post("/calculator/mul")
def mul_numbers(data: OperationInput):
    validate_numbers(data.numbers)
    result = 1
    for n in data.numbers:
        result *= n
    save_history("mul", data.numbers, result)
    return {"operation": "mul", "numbers": data.numbers, "result": result}

@app.post("/calculator/div")
def div_numbers(data: OperationInput):
    validate_numbers(data.numbers)
    if any(n == 0 for n in data.numbers[1:]):  # evitar dividir entre cero
        raise HTTPException(
            status_code=403,
            detail={"error": "División entre cero no permitida", "numbers": data.numbers},
        )
    result = data.numbers[0]
    for n in data.numbers[1:]:
        result /= n
    save_history("div", data.numbers, result)
    return {"operation": "div", "numbers": data.numbers, "result": result}

# Historial con filtros
@app.get("/calculator/history")
def obtain_history(
    operation: Optional[str] = Query(None, description="sum|sub|mul|div"),
    sort_by: Optional[str] = Query("date", description="date or result"),
    order: Optional[str] = Query("desc", description="asc or desc"),
    limit: int = Query(10, ge=1, le=100),
):
    query = {}

    # Filtrar por operación (si se pidió)
    if operation:
        if operation not in {"sum", "sub", "mul", "div"}:
            raise HTTPException(
                status_code=400,
                detail={"error": "Operación no válida. Usa sum, sub, mul o div", "operation": operation},
            )
        query["operation"] = operation

    # Orden y campo de ordenamiento
    sort_field = "date" if sort_by not in {"date", "result"} else sort_by
    sort_order = -1 if order == "desc" else 1

    records = collection_historial.find(query).sort(sort_field, sort_order).limit(limit)

    history = []
    for record in records:
        history.append({
            "operation": record.get("operation"),
            "numbers": record.get("numbers"),
            "result": record.get("result"),
            "date": record["date"].isoformat() if "date" in record else None
        })

    return {"history": history}
