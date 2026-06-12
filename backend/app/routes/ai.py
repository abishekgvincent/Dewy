from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.ai import (
    AISegmentRequest, AISegmentResponse,
    AIMessageRequest, AIMessageResponse,
    AIRecommendChannelRequest, AIRecommendChannelResponse,
    AICampaignMetrics, AICampaignInsightsResponse
)
from app.services.ai_service import (
    segment_customers_ai,
    generate_campaign_messages_ai,
    recommend_channel_ai,
    generate_campaign_insights_ai
)
from app.services.query_service import get_segment_stats

router = APIRouter()

@router.post("/segment", response_model=AISegmentResponse)
def preview_segment(payload: AISegmentRequest, db: Session = Depends(get_db)):
    try:
        # Convert natural language to filters using Gemini
        segment_name, filters = segment_customers_ai(payload.prompt)
        
        # Get matching customer stats and customer records
        size, avg_spend, customers = get_segment_stats(db, filters)
        
        return AISegmentResponse(
            segment_name=segment_name,
            filters=filters,
            audience_size=size,
            average_spend=avg_spend,
            customers=customers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process segmentation: {str(e)}")

@router.post("/message", response_model=AIMessageResponse)
def generate_messages(payload: AIMessageRequest):
    try:
        variants = generate_campaign_messages_ai(payload.segment_name, payload.channel)
        return AIMessageResponse(
            variant_a=variants["variant_a"],
            variant_b=variants["variant_b"],
            variant_c=variants["variant_c"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign messages: {str(e)}")

@router.post("/recommend-channel", response_model=AIRecommendChannelResponse)
def recommend_channel(payload: AIRecommendChannelRequest):
    try:
        channel, reasoning = recommend_channel_ai(payload.segment_name, payload.filters)
        return AIRecommendChannelResponse(
            recommended_channel=channel,
            reasoning=reasoning
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recommend channel: {str(e)}")

@router.post("/insights", response_model=AICampaignInsightsResponse)
def campaign_insights(payload: AICampaignMetrics):
    try:
        insights = generate_campaign_insights_ai(payload)
        return insights
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate campaign insights: {str(e)}")
