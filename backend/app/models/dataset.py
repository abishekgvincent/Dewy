from sqlalchemy import Column, DateTime, Integer, String, JSON, func
from app.db.database import Base

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    status = Column(String, default="processed", nullable=False) # processing, processed, error
    row_counts = Column(JSON, nullable=True) # e.g., {"customers": 1000, "products": 100, "orders": 5000}
    schema_info = Column(JSON, nullable=True) # columns and types mapping
    intelligence_summary = Column(JSON, nullable=True) # KPI stats, affinity rules, etc.
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
