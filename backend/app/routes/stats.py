from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.campaign import Campaign
from app.models.communication import Communication

router = APIRouter()

@router.get("/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # 1. Total Customers
    total_customers = db.query(Customer).count()
    
    # 2. Total Orders
    total_orders = db.query(Order).count()
    
    # 3. Revenue
    revenue = db.query(func.sum(Order.order_amount)).scalar() or 0.0
    revenue = round(float(revenue), 2)
    
    # 4. Campaign Count
    campaign_count = db.query(Campaign).count()
    
    # 5. Communications for Funnel & Rates
    total_comms = db.query(Communication).count()
    
    sent = db.query(Communication).filter(Communication.status != "Queued").count()
    delivered = db.query(Communication).filter(
        Communication.status.in_(["Delivered", "Opened", "Clicked", "Purchased"])
    ).count()
    opened = db.query(Communication).filter(
        Communication.status.in_([ "Opened", "Clicked", "Purchased"])
    ).count()
    clicked = db.query(Communication).filter(
        Communication.status.in_(["Clicked", "Purchased"])
    ).count()
    purchased = db.query(Communication).filter(Communication.status == "Purchased").count()
    
    open_rate = round(opened / delivered, 4) if delivered > 0 else 0.0
    click_rate = round(clicked / opened, 4) if opened > 0 else 0.0
    conversion_rate = round(purchased / sent, 4) if sent > 0 else 0.0
    
    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "revenue": revenue,
        "campaign_count": campaign_count,
        "funnel": {
            "total": total_comms,
            "sent": sent,
            "delivered": delivered,
            "opened": opened,
            "clicked": clicked,
            "purchased": purchased
        },
        "open_rate": open_rate,
        "click_rate": click_rate,
        "conversion_rate": conversion_rate
    }
