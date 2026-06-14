from sqlalchemy import Column, DateTime, Integer, String, Float, func
from app.db.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    city = Column(String, nullable=True)
    category_preference = Column(String, nullable=True)  # Apparel, Electronics, Home, Beauty
    age_group = Column(String, nullable=True)  # 18-24, 25-34, 35-44, 45+
    total_spend = Column(Float, default=0.0, nullable=False)
    persona = Column(String, nullable=True)     # VIP, Regular, Dormant, SunCare, AcneCare
    signup_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
