from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CustomerBase(BaseModel):
    name: str
    email: str
    phone: str | None = None
    city: str | None = None
    category_preference: str | None = None  # Apparel, Electronics, Home, Beauty
    age_group: str | None = None  # 18-24, 25-34, 35-44, 45+
    persona: str | None = None    # VIP, Regular, Dormant, SunCare, AcneCare

class CustomerCreate(CustomerBase):
    signup_date: datetime | None = None

class CustomerRead(CustomerBase):
    id: int
    total_spend: float
    signup_date: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
