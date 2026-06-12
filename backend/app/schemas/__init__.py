from app.schemas.customer import CustomerBase, CustomerCreate, CustomerRead
from app.schemas.product import ProductBase, ProductCreate, ProductRead
from app.schemas.order import OrderBase, OrderCreate, OrderRead, OrderItemBase, OrderItemRead
from app.schemas.segment import SegmentBase, SegmentCreate, SegmentRead
from app.schemas.campaign import CampaignBase, CampaignCreate, CampaignRead
from app.schemas.communication import CommunicationBase, CommunicationRead, CommunicationEventBase, CommunicationEventRead
from app.schemas.insight import AIInsightBase, AIInsightRead
from app.schemas.ai import (
    AISegmentRequest, AISegmentResponse,
    AIMessageRequest, AIMessageResponse,
    AIRecommendChannelRequest, AIRecommendChannelResponse,
    AICampaignMetrics, AICampaignInsightsResponse
)

__all__ = [
    "CustomerBase", "CustomerCreate", "CustomerRead",
    "ProductBase", "ProductCreate", "ProductRead",
    "OrderBase", "OrderCreate", "OrderRead", "OrderItemBase", "OrderItemRead",
    "SegmentBase", "SegmentCreate", "SegmentRead",
    "CampaignBase", "CampaignCreate", "CampaignRead",
    "CommunicationBase", "CommunicationRead", "CommunicationEventBase", "CommunicationEventRead",
    "AIInsightBase", "AIInsightRead",
    "AISegmentRequest", "AISegmentResponse",
    "AIMessageRequest", "AIMessageResponse",
    "AIRecommendChannelRequest", "AIRecommendChannelResponse",
    "AICampaignMetrics", "AICampaignInsightsResponse"
]
