from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AIInsightBase(BaseModel):
    campaign_id: int
    insight: str
    recommendation: str

class AIInsightRead(AIInsightBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
