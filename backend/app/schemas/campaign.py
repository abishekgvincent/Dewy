from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.segment import SegmentRead

class CampaignBase(BaseModel):
    name: str
    channel: str  # WhatsApp, SMS, Email, RCS
    message: str
    status: str = "Draft"  # Draft, Running, Completed
    segment_id: int | None = None

class CampaignCreate(CampaignBase):
    pass

class CampaignRead(CampaignBase):
    id: int
    created_at: datetime
    segment: SegmentRead | None = None

    model_config = ConfigDict(from_attributes=True)
