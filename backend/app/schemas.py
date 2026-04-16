from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    id: str
    name: str
    category: str
    quantity: float
    unit: str
    price: Optional[float] = None
    comment: Optional[str] = None
    checked: Optional[bool] = None
    chefComment: Optional[str] = None
    deliveryDate: Optional[str] = None
    lastPrice: Optional[float] = None

class Order(BaseModel):
    id: str
    status: str
    products: List[Product]
    createdAt: str
    deliveredAt: Optional[str] = None
    estimatedDeliveryDate: Optional[str] = None
    branch: str

class UserRegister(BaseModel):
    telegram_id: int
    full_name: str
    role: str
    branch: str
    language: str = "ru"
