import asyncio
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Communication
from app.schemas import HealthResponse, SendRequest, SendResponse
from app.simulator import simulate_communication

router = APIRouter()
logger = logging.getLogger("channel_service.routes")


@router.post("/send", response_model=SendResponse)
async def send_message(payload: SendRequest, db: Session = Depends(get_db)) -> SendResponse:
    logger.info(f"Incoming /send payload: {payload.dict()}")
    existing = db.query(Communication).filter(
        Communication.communication_id == payload.communication_id
    ).first()
    if existing:
        logger.info("Communication already accepted communication_id=%s", payload.communication_id)
        return SendResponse(status="accepted", communication_id=payload.communication_id)

    communication = Communication(
        communication_id=payload.communication_id,
        campaign_id=payload.campaign_id,
        customer_id=payload.customer_id,
        recipient=str(payload.recipient),
        channel=payload.channel,
        message=payload.message,
        status="PENDING",
    )
    db.add(communication)
    db.commit()

    logger.info(
        "Communication received communication_id=%s campaign_id=%s channel=%s",
        payload.communication_id,
        payload.campaign_id,
        payload.channel,
    )
    asyncio.create_task(simulate_communication(payload.communication_id))
    return SendResponse(status="accepted", communication_id=payload.communication_id)


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="healthy")


@router.post("/test-send")
async def test_send(payload: SendRequest):
    logger.info(f"Incoming /test-send payload: {payload.dict()}")
    return {"status": "success"}
