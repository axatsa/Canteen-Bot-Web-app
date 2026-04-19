from pydantic import BaseModel
from typing import List, Optional, Dict, Any

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


# ── Delivery tracking schemas ──────────────────────────────────────────────────

class MarkSupplierReceivedRequest(BaseModel):
    received_date: str  # DD.MM.YYYY

class DeliveryItem(BaseModel):
    ordered_qty: float
    received_qty: float
    status: str  # delivered | partial | not_delivered | pending

class UpdateDeliveryRequest(BaseModel):
    delivery_tracking: Dict[str, DeliveryItem]
    extra_items: Dict[str, float] = {}

class ArchiveRequest(BaseModel):
    archived_by: str = "snabjenec"


# ── Template schemas ───────────────────────────────────────────────────────────

class TemplateResponse(BaseModel):
    template_id: str
    name: str
    description: Optional[str] = None
    uploaded_at: str
    file_size: Optional[int] = None

class ExportTemplateRequest(BaseModel):
    template_id: str
    format: str = "docx"  # docx | pdf
