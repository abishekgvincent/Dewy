from sqlalchemy import Column, DateTime, Integer, String, JSON, func
from app.db.database import Base

class Segment(Base):
    __tablename__ = "segments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    filters = Column(JSON, nullable=False) # e.g. {"bought": "Sunscreen", "not_bought": "Moisturizer"}
    audience_size = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
