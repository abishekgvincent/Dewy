from datetime import datetime
from pydantic import BaseModel, ConfigDict

class SegmentBase(BaseModel):
    name: str
    description: str | None = None
    filters: dict

class SegmentCreate(SegmentBase):
    pass

class SegmentRead(SegmentBase):
    id: int
    audience_size: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
