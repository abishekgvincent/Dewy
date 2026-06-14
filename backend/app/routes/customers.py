from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerRead

router = APIRouter()

@router.get("/", response_model=list[CustomerRead])
def list_customers(
    search: str | None = None,
    category_preference: str | None = None,
    age_group: str | None = None,
    persona: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) |
            (Customer.email.ilike(f"%{search}%")) |
            (Customer.city.ilike(f"%{search}%"))
        )
        
    if category_preference:
        query = query.filter(Customer.category_preference == category_preference)
        
    if age_group:
        query = query.filter(Customer.age_group == age_group)
        
    if persona:
        query = query.filter(Customer.persona == persona)
        
    # Return sorted by total_spend descending to show top customers
    return query.order_by(Customer.total_spend.desc()).limit(100).all()
