from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, JSON, func
from app.db.database import Base

class CommunicationEvent(Base):
    __tablename__ = "communication_events"

    id = Column(Integer, primary_key=True, index=True)
    communication_id = Column(Integer, ForeignKey("communications.id", ondelete="CASCADE"), index=True, nullable=False)
    event_type = Column(String, nullable=False)  # SENT, DELIVERED, FAILED, OPENED, CLICKED, PURCHASED
    event_timestamp = Column(DateTime, server_default=func.now(), nullable=False)
    metadata_json = Column(JSON, name="metadata", nullable=True) # JSON field for payload metadata
