import uuid
from sqlalchemy import Column, DateTime, JSON, func
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base

class CallbackLog(Base):
    __tablename__ = "callback_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    communication_id = Column(UUID(as_uuid=True), nullable=True)
    payload = Column(JSON, nullable=True)
    received_at = Column(DateTime, server_default=func.now(), nullable=True)
