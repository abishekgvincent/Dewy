from pydantic import BaseModel
from app.schemas.customer import CustomerRead

class AISegmentRequest(BaseModel):
    prompt: str

class AISegmentResponse(BaseModel):
    segment_name: str
    filters: dict
    audience_size: int
    average_spend: float
    customers: list[CustomerRead]

class AIMessageRequest(BaseModel):
    segment_name: str
    channel: str

class AIMessageResponse(BaseModel):
    variant_a: str
    variant_b: str
    variant_c: str

class AIRecommendChannelRequest(BaseModel):
    segment_name: str
    description: str | None = None
    filters: dict

class AIRecommendChannelResponse(BaseModel):
    recommended_channel: str
    reasoning: str

class AICampaignMetrics(BaseModel):
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    purchased_count: int
    revenue: float
    channel: str
    segment_name: str

class AICampaignInsightsResponse(BaseModel):
    summary: str
    recommendations: str
    next_best_campaign: str
