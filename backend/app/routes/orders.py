from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from app.models.order import Order
from app.schemas.order import OrderRead

router = APIRouter()

@router.get("/", response_model=list[OrderRead])
def list_orders(db: Session = Depends(get_db)):
    # Retrieve recent 100 orders with eager loaded items and products
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product)
    ).order_by(Order.order_date.desc()).limit(100).all()
