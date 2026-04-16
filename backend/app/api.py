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

@app.post("/users/register")
async def register_user(user: schemas.UserRegister):
    success = crud.save_user(
        user.telegram_id, 
        user.full_name, 
        user.role, 
        user.branch, 
        user.language
    )
    if not success:
        raise HTTPException(status_code=500, detail="Failed to register user")
    return {"status": "success"}

@app.get("/users/{telegram_id}")
async def get_user(telegram_id: int):
    user = crud.get_user_by_telegram_id(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
