import asyncio
import logging
import random
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.callback import send_callback_with_retries
from app.config import settings
from app.database import SessionLocal
from app.models import Communication, CommunicationEvent
from app.schemas import EventType

logger = logging.getLogger("channel_service.simulator")


async def simulate_communication(communication_id: str) -> None:
    db: Session = SessionLocal()
    try:
        communication = db.query(Communication).filter(
            Communication.communication_id == communication_id
        ).first()
        if not communication:
            logger.error("Communication not found for communication_id=%s", communication_id)
            return

        await asyncio.sleep(settings.delivered_delay_seconds)
        delivery_event = "DELIVERED" if random.random() < 0.90 else "FAILED"
        await _create_event_and_callback(db, communication, delivery_event)

        if delivery_event == "FAILED":
            communication.status = "FAILED"
            db.commit()
            return

        communication.status = "DELIVERED"
        db.commit()

        if random.random() < 0.60:
            await asyncio.sleep(max(settings.opened_delay_seconds - settings.delivered_delay_seconds, 0))
            await _create_event_and_callback(db, communication, "OPENED")

        if random.random() < 0.40:
            await asyncio.sleep(max(settings.read_delay_seconds - settings.opened_delay_seconds, 0))
            await _create_event_and_callback(db, communication, "READ")

        if random.random() < 0.20:
            await asyncio.sleep(max(settings.clicked_delay_seconds - settings.read_delay_seconds, 0))
            await _create_event_and_callback(db, communication, "CLICKED")
    finally:
        db.close()


async def _create_event_and_callback(db: Session, communication: Communication, event_type: EventType) -> None:
    event_id = f"evt_{uuid.uuid4().hex}"
    existing = db.query(CommunicationEvent).filter(CommunicationEvent.event_id == event_id).first()
    if existing:
        return

    event_time = datetime.now(timezone.utc)
    db.add(
        CommunicationEvent(
            event_id=event_id,
            communication_id=communication.communication_id,
            event_type=event_type,
            event_time=event_time,
        )
    )
    db.commit()
    logger.info(
        "Event generated event_id=%s communication_id=%s event_type=%s",
        event_id,
        communication.communication_id,
        event_type,
    )
    await send_callback_with_retries(
        db,
        event_id=event_id,
        communication_id=communication.communication_id,
        event=event_type,
        event_time=event_time,
    )
