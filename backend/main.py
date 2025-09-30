import datetime
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from pymongo import MongoClient
from fastapi.middleware.cors import CORSMiddleware
from typing import List

# Inicializar FastAPI
app = FastAPI()

# Configuración de CORS
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

# Función auxiliar para validaciones
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

# Endpoints

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

@app.get("/calculator/history")
def obtain_history(limit: int = 10):
    records = collection_historial.find().sort("date", -1).limit(limit)
    history = []
    for record in records:
        history.append({
            "operation": record.get("operation"),
            "numbers": record.get("numbers"),
            "result": record.get("result"),
            "date": record["date"].isoformat() if "date" in record else None
        })
    return {"history": history}
