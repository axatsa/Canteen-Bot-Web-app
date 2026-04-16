from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from . import schemas, crud

app = FastAPI(title="Optimizer API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/products", response_model=List[schemas.Product])
async def get_products():
    return crud.get_all_products()

@app.get("/orders", response_model=List[schemas.Order])
async def get_orders():
    return crud.get_all_orders()

@app.post("/orders/upsert")
async def upsert_order(order: schemas.Order):
    success = crud.upsert_order(order.dict())
    if not success:
        raise HTTPException(status_code=500, detail="Failed to save order")
    return {"status": "success"}
