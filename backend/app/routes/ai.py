from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.models.dataset import Dataset
from app.services.ai_service import (
    recommend_segments_ai,
    recommend_channels_ai,
    generate_messages_variants_ai,
    segment_customers_ai
)
from app.services.query_service import get_segment_stats

router = APIRouter()


def build_transparency_steps(kind: str, *, prompt: str | None = None, name: str | None = None) -> list[str]:
    steps = [
        "Analyzed customer purchase behavior",
        "Calculated audience size from the active dataset",
    ]
    if prompt:
        steps.append(f'Compared the campaign goal "{prompt}" against customer traits')
    if kind == "opportunity":
        steps.extend([
            "Estimated revenue potential from audience size and order value",
            "Ranked opportunities by projected business impact",
        ])
    elif kind == "segment":
        steps.extend([
            "Matched customers to targeting filters",
            "Ranked valid segments after removing zero-audience results",
        ])
    elif kind == "channel":
        steps.extend([
            f"Compared delivery channels for {name or 'this audience'}",
            "Ranked channels by expected engagement and fit",
        ])
    elif kind == "message":
        steps.extend([
            f"Generated message variants for {name or 'this audience'}",
            "Ranked copy by predicted click-through potential",
        ])
    return steps

class AISegmentPromptRequest(BaseModel):
    prompt: str

@router.post("/segment")
def segment_customers(payload: AISegmentPromptRequest, db: Session = Depends(get_db)):
    """
    Given a prompt, calls Gemini to parse filters, runs database stats, and returns the segment info.
    """
    try:
        segment_name, filters = segment_customers_ai(payload.prompt)
        size, avg_spend, customers = get_segment_stats(db, filters)
        return {
            "segment_name": segment_name,
            "filters": filters,
            "audience_size": size,
            "average_spend": avg_spend,
            "customers": [
                {
                    "id": c.id,
                    "name": c.name,
                    "email": c.email,
                    "phone": c.phone,
                    "city": c.city,
                    "skin_type": c.skin_type,
                    "age_group": c.age_group,
                    "persona": c.persona,
                    "total_spend": c.total_spend,
                    "signup_date": c.signup_date
                } for c in customers
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class AIChannelRecommendRequest(BaseModel):
    segment_name: str
    filters: dict

class AIMessageVariantsRequest(BaseModel):
    segment_name: str
    channel: str

@router.post("/intelligence")
def get_dataset_intelligence(db: Session = Depends(get_db)):
    """
    Returns the customer intelligence report computed during the latest dataset ingestion.
    """
    dataset = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
    if not dataset or not dataset.intelligence_summary:
        # If no dataset uploaded yet, return dummy beauty listing
        return {
            "total_customers": 0,
            "total_orders": 0,
            "total_revenue": 0.0,
            "vip_percentage": 0.0,
            "dormant_percentage": 0.0,
            "refill_candidates_count": 0,
            "affinity_rules": [],
            "top_city": "N/A",
            "highest_spending_age_group": "N/A",
            "confidence_scores": {
                "vip": 0.95,
                "dormant": 0.94,
                "refills": 0.91,
                "affinity": 0.88,
                "top_city": 0.98,
                "highest_spending_age_group": 0.94
            }
        }
    return dataset.intelligence_summary


@router.post("/opportunities")
def get_marketing_opportunities(db: Session = Depends(get_db)):
    """
    Returns the discovered marketing opportunities for the active dataset.
    """
    dataset = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
    if not dataset or not dataset.intelligence_summary or "opportunities" not in dataset.intelligence_summary:
        return []
    opportunities = []
    for opportunity in dataset.intelligence_summary["opportunities"]:
        enriched = dict(opportunity)
        enriched.setdefault("reasoning_steps", build_transparency_steps("opportunity", name=opportunity.get("title")))
        opportunities.append(enriched)
    return opportunities


@router.post("/segments")
def recommend_campaign_segments(payload: AISegmentPromptRequest, db: Session = Depends(get_db)):
    """
    Recommends segments matching a business objective, calculating audience counts live.
    """
    try:
        recommendations = recommend_segments_ai(payload.prompt)
        latest_dataset = db.query(Dataset).order_by(Dataset.created_at.desc()).first()
        total_customers = 0
        if latest_dataset and latest_dataset.row_counts:
            total_customers = latest_dataset.row_counts.get("customers", 0)
        
        # Calculate size and stats for each recommended segment dynamically
        detailed_recs = []
        for rec in recommendations:
            filters = rec.get("filters", {})
            size, avg_spend, _ = get_segment_stats(db, filters)

            if size <= 0:
                continue

            detailed_recs.append({
                "name": rec["name"],
                "confidence": rec["confidence"],
                "reason": rec["reason"],
                "filters": filters,
                "audience_size": size,
                "average_spend": avg_spend,
                "audience_share": round((size / max(total_customers, 1)) * 100, 1) if total_customers else 0.0,
                "reasoning_steps": build_transparency_steps("segment", prompt=payload.prompt, name=rec["name"]),
            })

        detailed_recs.sort(key=lambda item: (item["confidence"], item["audience_size"]), reverse=True)

        for index, rec in enumerate(detailed_recs, start=1):
            rec["rank"] = index

        return detailed_recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recommend segments: {str(e)}")


@router.post("/channels")
def recommend_campaign_channels(payload: AIChannelRecommendRequest):
    """
    Returns channel rankings and scores for a specific audience segment.
    """
    try:
        channels = recommend_channels_ai(payload.segment_name, payload.filters)
        return [
            {
                **channel,
                "reasoning_steps": channel.get("reasoning_steps") or build_transparency_steps(
                    "channel",
                    name=payload.segment_name,
                ),
            }
            for channel in channels
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to recommend channels: {str(e)}")


@router.post("/messages")
def generate_copy_variants(payload: AIMessageVariantsRequest):
    """
    Generates three message variants with predicted CTR and confidence.
    """
    try:
        variants = generate_messages_variants_ai(payload.segment_name, payload.channel)
        return [
            {
                **variant,
                "reasoning_steps": variant.get("reasoning_steps") or build_transparency_steps(
                    "message",
                    name=payload.segment_name,
                ),
            }
            for variant in variants
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate messages copy variants: {str(e)}")
