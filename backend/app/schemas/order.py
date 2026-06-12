from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.product import ProductRead

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float

class OrderItemRead(OrderItemBase):
    id: int
    order_id: int
    product: ProductRead | None = None

    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    customer_id: int
    order_amount: float
    order_date: datetime

class OrderCreate(OrderBase):
    items: list[OrderItemBase] = []

class OrderRead(OrderBase):
    id: int
    created_at: datetime
    items: list[OrderItemRead] = []

    model_config = ConfigDict(from_attributes=True)
