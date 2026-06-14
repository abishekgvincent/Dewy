import asyncio
import logging
from datetime import datetime, timezone

import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.models import CallbackLog
from app.schemas import CallbackPayload, EventType

logger = logging.getLogger("channel_service.callback")


async def send_callback_with_retries(
    db: Session,
    *,
    event_id: str,
    communication_id: str,
    event: EventType,
    event_time: datetime,
) -> None:
    payload = CallbackPayload(
        event_id=event_id,
        communication_id=communication_id,
        event=event,
        timestamp=event_time.astimezone(timezone.utc),
    )

    async with httpx.AsyncClient(timeout=settings.callback_timeout_seconds) as client:
        retry_schedule = (0, *settings.retry_delays_seconds)
        for attempt, delay in enumerate(retry_schedule, start=1):
            if delay > 0:
                logger.info(
                    "Retrying callback for event_id=%s in %s seconds",
                    event_id,
                    delay,
                )
                await asyncio.sleep(delay)

            try:
                response = await client.post(settings.crm_callback_url, json=payload.model_dump(mode="json"))
                db.add(
                    CallbackLog(
                        event_id=event_id,
                        communication_id=communication_id,
                        attempt=attempt,
                        status="SUCCESS" if response.is_success else "FAILED",
                        response_code=response.status_code,
                        error_message=None if response.is_success else response.text[:1000],
                    )
                )
                db.commit()

                if response.is_success:
                    logger.info("Callback sent for event_id=%s communication_id=%s", event_id, communication_id)
                    return

                logger.warning(
                    "Callback failed for event_id=%s attempt=%s response_code=%s",
                    event_id,
                    attempt,
                    response.status_code,
                )
            except httpx.HTTPError as exc:
                db.add(
                    CallbackLog(
                        event_id=event_id,
                        communication_id=communication_id,
                        attempt=attempt,
                        status="FAILED",
                        response_code=None,
                        error_message=str(exc)[:1000],
                    )
                )
                db.commit()
                logger.warning(
                    "Callback error for event_id=%s attempt=%s error=%s",
                    event_id,
                    attempt,
                    exc,
                )

        logger.error("Exhausted callback retries for event_id=%s communication_id=%s", event_id, communication_id)
