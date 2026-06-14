from sqlalchemy import Column, DateTime, Integer, String, Float, func
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # Apparel, Electronics, Home, Beauty, Sports, Books
    price = Column(Float, nullable=False)
    refill_cycle_days = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
