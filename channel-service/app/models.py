import uuid

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Communication(Base):
    __tablename__ = "communications"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    communication_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    campaign_id: Mapped[str] = mapped_column(String(255), index=True)
    customer_id: Mapped[str] = mapped_column(String(255), index=True)
    recipient: Mapped[str] = mapped_column(String(255), index=True)
    channel: Mapped[str] = mapped_column(String(50))
    message: Mapped[str] = mapped_column(Text())
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CommunicationEvent(Base):
    __tablename__ = "communication_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    communication_id: Mapped[str] = mapped_column(String(255), index=True)
    event_type: Mapped[str] = mapped_column(String(50), index=True)
    event_time: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class CallbackLog(Base):
    __tablename__ = "callback_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[str] = mapped_column(String(255), index=True)
    communication_id: Mapped[str] = mapped_column(String(255), index=True)
    attempt: Mapped[int] = mapped_column(Integer())
    status: Mapped[str] = mapped_column(String(50), index=True)
    response_code: Mapped[int | None] = mapped_column(Integer(), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text(), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
