import os
import requests
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.models.campaign import Campaign
from app.models.customer import Customer
from app.models.order import Order
from app.models.segment import Segment
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent
from app.models.insight import AIInsight
from app.schemas.campaign import CampaignCreate, CampaignRead
from app.services.query_service import build_customer_query, get_segment_stats
from app.services.ai_service import generate_campaign_insights_ai
from app.schemas.ai import AICampaignMetrics

router = APIRouter()
logger = logging.getLogger("campaigns_route")

class SendCampaignRequest(BaseModel):
    campaign_id: int

class CampaignCreatePayload(BaseModel):
    name: str
    channel: str
    message: str
    segment_id: int | None = None
    # If segment_id is not provided, we can pass segment filters to create a new segment
    segment_name: str | None = None
    filters: dict | None = None
    description: str | None = None

def generate_campaign_insight_background(campaign_id: int):
    db: Session = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign or campaign.status != "Completed":
            return

        existing = db.query(AIInsight).filter(AIInsight.campaign_id == campaign_id).first()
        if existing:
            return

        segment = db.query(Segment).filter(Segment.id == campaign.segment_id).first()
        sent_count = db.query(Communication).filter(Communication.campaign_id == campaign_id).count()
        delivered_count = db.query(Communication).filter(
            Communication.campaign_id == campaign_id,
            Communication.status.in_(["Delivered", "Opened", "Clicked", "Purchased"])
        ).count()
        opened_count = db.query(Communication).filter(
            Communication.campaign_id == campaign_id,
            Communication.status.in_(["Opened", "Clicked", "Purchased"])
        ).count()
        clicked_count = db.query(Communication).filter(
            Communication.campaign_id == campaign_id,
            Communication.status.in_(["Clicked", "Purchased"])
        ).count()
        purchased_count = db.query(Communication).filter(
            Communication.campaign_id == campaign_id,
            Communication.status == "Purchased"
        ).count()

        purchased_customer_ids = db.query(Communication.customer_id).filter(
            Communication.campaign_id == campaign_id,
            Communication.status == "Purchased"
        ).all()
        purchased_customer_ids = [c[0] for c in purchased_customer_ids]

        revenue = 0.0
        if purchased_customer_ids:
            revenue_val = db.query(Order.order_amount).filter(
                Order.customer_id.in_(purchased_customer_ids),
                Order.order_date >= campaign.created_at
            ).all()
            revenue = sum(r[0] for r in revenue_val)

        metrics = AICampaignMetrics(
            sent_count=sent_count,
            delivered_count=delivered_count,
            opened_count=opened_count,
            clicked_count=clicked_count,
            purchased_count=purchased_count,
            revenue=round(revenue, 2),
            channel=campaign.channel,
            segment_name=segment.name if segment else "Custom"
        )
        ai_res = generate_campaign_insights_ai(metrics)
        insight = AIInsight(
            campaign_id=campaign_id,
            insight=ai_res.summary,
            recommendation=f"{ai_res.recommendations}\n\n**Next Recommended Campaign**: {ai_res.next_best_campaign}"
        )
        db.add(insight)
        db.commit()
    except Exception as e:
        logger.error(f"Failed to generate campaign insights in background: {e}")
    finally:
        db.close()

def run_campaign_send(campaign_id: int):
    """
    Background task to send campaign communications to the channel simulator
    """
    db: Session = SessionLocal()
    try:
        # 1. Fetch Campaign
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            logger.error(f"Campaign {campaign_id} not found in background task")
            return
            
        # 2. Fetch Segment
        segment = db.query(Segment).filter(Segment.id == campaign.segment_id).first()
        if not segment:
            logger.error(f"Segment not found for campaign {campaign_id}")
            return
            
        # 3. Fetch Customers matching the filters
        query = build_customer_query(db, segment.filters)
        customers = query.all()
        logger.info(f"Sending campaign {campaign_id} to {len(customers)} customers")
        
        channel_service_url = os.getenv("CHANNEL_SERVICE_URL", "http://localhost:8001").strip()
        
        # 4. Create and bulk-insert Communication records in one single commit to avoid remote db roundtrips
        comms = []
        for c in customers:
            comm = Communication(
                campaign_id=campaign.id,
                customer_id=c.id,
                channel=campaign.channel,
                message=campaign.message,
                status="Queued"
            )
            db.add(comm)
            comms.append(comm)
        db.commit()
        
        # 5. Dispatch to channel simulator
        for comm in comms:
            payload = {
                "campaign_id": str(campaign.id),
                "customer_id": str(comm.customer_id),
                "communication_id": str(comm.id),
                "recipient": c.email,
                "channel": campaign.channel.lower(),
                "message": campaign.message
            }
            
            logger.info(f"Outgoing CRM payload: {payload}")
            
            try:
                # Post to Channel Simulator (No trailing slash)
                response = requests.post(f"{channel_service_url}/send", json=payload, timeout=5)
                if response.status_code == 200:
                    comm.status = "Sent"
                    # Log SENT event
                    evt = CommunicationEvent(
                        communication_id=comm.id,
                        event_type="SENT",
                        event_timestamp=datetime.utcnow()
                    )
                    db.add(evt)
                else:
                    comm.status = "Failed"
                    error_msg = f"Channel service returned status {response.status_code}: {response.text}"
                    logger.error(f"Validation/Simulator Error: {error_msg} for payload {payload}")
                    evt = CommunicationEvent(
                        communication_id=comm.id,
                        event_type="FAILED",
                        event_timestamp=datetime.utcnow(),
                        metadata_json={"error": error_msg}
                    )
                    db.add(evt)
            except Exception as e:
                logger.error(f"Failed calling channel simulator for communication {comm.id}: {e}")
                comm.status = "Failed"
                evt = CommunicationEvent(
                    communication_id=comm.id,
                    event_type="FAILED",
                    event_timestamp=datetime.utcnow(),
                    metadata_json={"error": str(e)}
                )
                db.add(evt)
                
        # Final commit to persist simulator request statuses
        db.commit()
            
        # 6. Mark campaign completed
        campaign.status = "Completed"
        db.commit()
        logger.info(f"Campaign {campaign_id} completed sending.")
        
    except Exception as e:
        logger.error(f"Failed in campaign send task: {e}")
    finally:
        db.close()


@router.get("/")
def list_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    result = []
    for c in campaigns:
        # Gather quick stats for list view
        total_count = db.query(Communication).filter(Communication.campaign_id == c.id).count()
        delivered_count = db.query(Communication).filter(
            Communication.campaign_id == c.id,
            Communication.status.in_(["Delivered", "Opened", "Clicked", "Purchased"])
        ).count()
        opened_count = db.query(Communication).filter(
            Communication.campaign_id == c.id,
            Communication.status.in_(["Opened", "Clicked", "Purchased"])
        ).count()
        purchased_count = db.query(Communication).filter(
            Communication.campaign_id == c.id,
            Communication.status == "Purchased"
        ).count()
        
        seg = db.query(Segment).filter(Segment.id == c.segment_id).first()
        
        result.append({
            "id": c.id,
            "name": c.name,
            "channel": c.channel,
            "message": c.message,
            "status": c.status,
            "created_at": c.created_at,
            "audience_size": seg.audience_size if seg else 0,
            "segment_name": seg.name if seg else "Custom",
            "stats": {
                "total": total_count,
                "delivered": delivered_count,
                "opened": opened_count,
                "purchased": purchased_count
            }
        })
    return result


@router.get("/{id}")
def get_campaign_detail(id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    segment = db.query(Segment).filter(Segment.id == campaign.segment_id).first()
    
    # 1. Funnel stats
    sent_count = db.query(Communication).filter(Communication.campaign_id == id).count()
    delivered_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status.in_(["Delivered", "Opened", "Clicked", "Purchased"])
    ).count()
    opened_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status.in_(["Opened", "Clicked", "Purchased"])
    ).count()
    clicked_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status.in_(["Clicked", "Purchased"])
    ).count()
    purchased_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status == "Purchased"
    ).count()
    
    # Calculate revenue generated by this campaign
    # We sum the order_amounts of orders matching this customer and generated after campaign sent_at
    # To keep it simple and robust, we retrieve orders that were created due to 'purchased' callbacks for this campaign.
    # In receipt.py, when a purchase callback occurs, we can store metadata linking it, or we can look up order items
    # purchased by customers in this campaign since it launched.
    # Let's count revenue generated based on the simulated orders from purchased callbacks.
    # To do this accurately, we can query orders created for customers in this campaign around or after communication sent_at.
    # Let's check: in our receipt callback, we create an order. Let's query total spend of customers who purchased in this campaign,
    # or sum up the orders created in this campaign.
    # A cleaner way is to sum order amounts from orders created for these customer IDs on the day of the campaign.
    # Let's calculate campaign revenue by summing order_amount for orders made by campaign customers who transitioned to 'Purchased' status.
    purchased_customer_ids = db.query(Communication.customer_id).filter(
        Communication.campaign_id == id,
        Communication.status == "Purchased"
    ).all()
    purchased_customer_ids = [c[0] for c in purchased_customer_ids]
    
    revenue = 0.0
    if purchased_customer_ids:
        # Sum orders for these customers created after campaign start
        revenue_val = db.query(Order.order_amount).filter(
            Order.customer_id.in_(purchased_customer_ids),
            Order.order_date >= campaign.created_at
        ).all()
        revenue = sum(r[0] for r in revenue_val)
    revenue = round(revenue, 2)
    
    # 2. Communications log
    comms = db.query(Communication).filter(Communication.campaign_id == id).all()
    comms_log = []
    for co in comms:
        cust = db.query(Customer).filter(Customer.id == co.customer_id).first()
        comms_log.append({
            "id": co.id,
            "customer_name": cust.name if cust else "Unknown",
            "customer_email": cust.email if cust else "",
            "channel": co.channel,
            "status": co.status,
            "sent_at": co.sent_at
        })
        
    # 3. AI Insights
    insight = db.query(AIInsight).filter(AIInsight.campaign_id == id).first()
    
    # Generate insights after the response so the analytics page never hangs on AI latency.
    if not insight and campaign.status == "Completed" and sent_count > 0:
        background_tasks.add_task(generate_campaign_insight_background, id)
            
    return {
        "id": campaign.id,
        "name": campaign.name,
        "channel": campaign.channel,
        "message": campaign.message,
        "status": campaign.status,
        "created_at": campaign.created_at,
        "segment": {
            "id": segment.id if segment else None,
            "name": segment.name if segment else "Custom",
            "description": segment.description if segment else ""
        },
        "stats": {
            "sent": sent_count,
            "delivered": delivered_count,
            "opened": opened_count,
            "clicked": clicked_count,
            "purchased": purchased_count,
            "revenue": revenue
        },
        "communications": comms_log,
        "insight": {
            "summary": insight.insight,
            "recommendations": insight.recommendation
        } if insight else None
    }


@router.post("/", response_model=CampaignRead)
def create_campaign(payload: CampaignCreatePayload, db: Session = Depends(get_db)):
    # If segment details are provided, create the segment
    seg_id = payload.segment_id
    if not seg_id and payload.filters and payload.segment_name:
        size, avg_spend, _ = get_segment_stats(db, payload.filters)
        seg = Segment(
            name=payload.segment_name,
            description=payload.description or f"Auto-created segment for campaign {payload.name}",
            filters=payload.filters,
            audience_size=size
        )
        db.add(seg)
        db.commit()
        seg_id = seg.id
        
    if not seg_id:
        raise HTTPException(status_code=400, detail="Either segment_id or segment creation details (filters and segment_name) must be provided.")
        
    campaign = Campaign(
        name=payload.name,
        channel=payload.channel,
        message=payload.message,
        segment_id=seg_id,
        status="Draft"
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.post("/send")
def send_campaign(payload: SendCampaignRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == payload.campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status == "Running":
        return {"status": "already_running", "campaign_id": campaign.id}
        
    campaign.status = "Running"
    db.commit()
    
    # Launch in background task to avoid blocking the HTTP thread
    background_tasks.add_task(run_campaign_send, campaign.id)
    
    return {"status": "started", "campaign_id": campaign.id}


@router.get("/{id}/analytics")
def get_campaign_analytics(id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    sent_count = db.query(Communication).filter(Communication.campaign_id == id).count()
    delivered_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status.in_(["Delivered", "Opened", "Clicked", "Purchased"])
    ).count()
    opened_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status.in_(["Opened", "Clicked", "Purchased"])
    ).count()
    clicked_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status.in_(["Clicked", "Purchased"])
    ).count()
    purchased_count = db.query(Communication).filter(
        Communication.campaign_id == id,
        Communication.status == "Purchased"
    ).count()
    
    # Calculate revenue
    purchased_customer_ids = db.query(Communication.customer_id).filter(
        Communication.campaign_id == id,
        Communication.status == "Purchased"
    ).all()
    purchased_customer_ids = [c[0] for c in purchased_customer_ids]
    
    revenue = 0.0
    if purchased_customer_ids:
        revenue_val = db.query(Order.order_amount).filter(
            Order.customer_id.in_(purchased_customer_ids),
            Order.order_date >= campaign.created_at
        ).all()
        revenue = sum(r[0] for r in revenue_val)
    revenue = round(revenue, 2)
    
    open_rate = opened_count / delivered_count if delivered_count > 0 else 0.0
    click_rate = clicked_count / opened_count if opened_count > 0 else 0.0
    conversion_rate = purchased_count / sent_count if sent_count > 0 else 0.0
    
    return {
        "id": campaign.id,
        "name": campaign.name,
        "status": campaign.status,
        "stats": {
            "sent": sent_count,
            "delivered": delivered_count,
            "opened": opened_count,
            "clicked": clicked_count,
            "purchased": purchased_count,
            "revenue": revenue
        },
        "rates": {
            "open_rate": round(open_rate, 4),
            "click_rate": round(click_rate, 4),
            "conversion_rate": round(conversion_rate, 4)
        }
    }
