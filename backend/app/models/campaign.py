from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from app.db.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    segment_id = Column(Integer, ForeignKey("segments.id", ondelete="SET NULL"), index=True, nullable=True)
    name = Column(String, nullable=False)
    channel = Column(String, nullable=False)  # WhatsApp, SMS, Email, RCS
    message = Column(Text, nullable=False)
    status = Column(String, default="Draft", nullable=False)  # Draft, Running, Completed
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
