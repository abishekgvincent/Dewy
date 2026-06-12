from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ProductBase(BaseModel):
    name: str
    category: str
    price: float
    refill_cycle_days: int | None = None

class ProductCreate(ProductBase):
    pass

class ProductRead(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
