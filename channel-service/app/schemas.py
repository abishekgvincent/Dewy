from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


EventType = Literal["DELIVERED", "FAILED", "OPENED", "READ", "CLICKED"]
ChannelType = Literal["email", "sms", "whatsapp", "rcs"]


class SendRequest(BaseModel):
    communication_id: str = Field(..., min_length=1, max_length=255)
    campaign_id: str = Field(..., min_length=1, max_length=255)
    customer_id: str = Field(..., min_length=1, max_length=255)
    recipient: EmailStr | str
    channel: ChannelType
    message: str = Field(..., min_length=1)


class SendResponse(BaseModel):
    status: Literal["accepted"]
    communication_id: str


class CallbackPayload(BaseModel):
    event_id: str
    communication_id: str
    event: EventType
    timestamp: datetime


class HealthResponse(BaseModel):
    status: Literal["healthy"]
