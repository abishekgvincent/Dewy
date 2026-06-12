import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent
from app.models.customer import Customer
from app.models.order import Order
from app.models.orderitem import OrderItem
from app.models.product import Product

router = APIRouter()

class ReceiptPayload(BaseModel):
    communication_id: int
    event: str  # SENT, DELIVERED, FAILED, OPENED, CLICKED, PURCHASED
    metadata: dict | None = None

@router.post("/")
def receive_receipt(payload: ReceiptPayload, db: Session = Depends(get_db)):
    # 1. Fetch communication
    comm = db.query(Communication).filter(Communication.id == payload.communication_id).first()
    if not comm:
        raise HTTPException(status_code=404, detail="Communication not found")
        
    # 2. Update communication status
    # Match the case of the event (e.g. SENT -> Sent, DELIVERED -> Delivered, etc.)
    status_mapping = {
        "SENT": "Sent",
        "DELIVERED": "Delivered",
        "FAILED": "Failed",
        "OPENED": "Opened",
        "CLICKED": "Clicked",
        "PURCHASED": "Purchased"
    }
    
    comm.status = status_mapping.get(payload.event.upper(), payload.event)
    
    # 3. Create communication event
    event = CommunicationEvent(
        communication_id=comm.id,
        event_type=payload.event.upper(),
        event_timestamp=datetime.utcnow(),
        metadata_json=payload.metadata
    )
    db.add(event)
    
    # 4. If PURCHASED, simulate a database order
    if payload.event.upper() == "PURCHASED":
        cust = db.query(Customer).filter(Customer.id == comm.customer_id).first()
        if cust:
            # Select 1-2 random products to simulate order items
            prods = db.query(Product).all()
            if prods:
                order_products = random.sample(prods, min(len(prods), random.randint(1, 2)))
                order_amount = 0.0
                order_items_temp = []
                
                # We need a new order id
                # Fetch maximum order ID to increment deterministically
                max_order_id = db.query(Order.id).order_by(Order.id.desc()).first()
                new_order_id = (max_order_id[0] + 1) if max_order_id else 1
                
                for p in order_products:
                    qty = 1
                    unit_p = p.price
                    item_total = round(qty * unit_p, 2)
                    order_amount += item_total
                    
                    item = OrderItem(
                        order_id=new_order_id,
                        product_id=p.id,
                        quantity=qty,
                        unit_price=unit_p
                    )
                    order_items_temp.append(item)
                    
                order_amount = round(order_amount, 2)
                
                new_order = Order(
                    id=new_order_id,
                    customer_id=cust.id,
                    order_amount=order_amount,
                    order_date=datetime.utcnow()
                )
                db.add(new_order)
                
                for item in order_items_temp:
                    db.add(item)
                    
                # Increment total spend
                cust.total_spend = round(cust.total_spend + order_amount, 2)
                
    db.commit()
    return {"status": "success", "communication_id": comm.id, "current_status": comm.status}
