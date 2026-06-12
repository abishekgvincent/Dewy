from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.customer import CustomerRead

class CommunicationEventBase(BaseModel):
    event_type: str
    metadata_json: dict | None = None

class CommunicationEventRead(CommunicationEventBase):
    id: int
    communication_id: int
    event_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class CommunicationBase(BaseModel):
    campaign_id: int
    customer_id: int
    channel: str
    message: str
    status: str = "Queued"

class CommunicationRead(CommunicationBase):
    id: int
    sent_at: datetime
    customer: CustomerRead | None = None
    events: list[CommunicationEventRead] = []

    model_config = ConfigDict(from_attributes=True)
