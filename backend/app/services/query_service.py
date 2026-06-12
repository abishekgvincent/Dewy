from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.customer import Customer
from app.models.order import Order
from app.models.orderitem import OrderItem
from app.models.product import Product

def build_customer_query(db: Session, filters: dict):
    """
    Translates filter dictionary to SQLAlchemy Customer query.
    Filters can contain:
    - skin_type (str or list[str])
    - age_group (str or list[str])
    - persona (str or list[str])
    - min_spend (float)
    - max_spend (float)
    - bought (str) - category name or product name
    - not_bought (str) - category name or product name
    - inactive_days (int) - days of inactivity (no orders in last X days)
    """
    query = db.query(Customer)
    
    # 1. skin_type
    if "skin_type" in filters and filters["skin_type"]:
        val = filters["skin_type"]
        if isinstance(val, list):
            query = query.filter(Customer.skin_type.in_(val))
        else:
            query = query.filter(Customer.skin_type == val)
            
    # 2. age_group
    if "age_group" in filters and filters["age_group"]:
        val = filters["age_group"]
        if isinstance(val, list):
            query = query.filter(Customer.age_group.in_(val))
        else:
            query = query.filter(Customer.age_group == val)
            
    # 3. persona
    if "persona" in filters and filters["persona"]:
        val = filters["persona"]
        if isinstance(val, list):
            query = query.filter(Customer.persona.in_(val))
        else:
            query = query.filter(Customer.persona == val)
            
    # 4. min_spend
    if "min_spend" in filters and filters["min_spend"] is not None:
        try:
            query = query.filter(Customer.total_spend >= float(filters["min_spend"]))
        except (ValueError, TypeError):
            pass
        
    # 5. max_spend
    if "max_spend" in filters and filters["max_spend"] is not None:
        try:
            query = query.filter(Customer.total_spend <= float(filters["max_spend"]))
        except (ValueError, TypeError):
            pass

    # 6. bought (Category or Product Name)
    if "bought" in filters and filters["bought"]:
        bought_val = filters["bought"]
        # Subquery to check if they have ordered this product/category
        subq = db.query(Order.customer_id).join(OrderItem).join(Product).filter(
            (Product.category.ilike(bought_val)) | (Product.name.ilike(f"%{bought_val}%"))
        ).subquery()
        query = query.filter(Customer.id.in_(subq))

    # 7. not_bought (Category or Product Name)
    if "not_bought" in filters and filters["not_bought"]:
        not_bought_val = filters["not_bought"]
        # Subquery to check if they have ordered this product/category
        subq = db.query(Order.customer_id).join(OrderItem).join(Product).filter(
            (Product.category.ilike(not_bought_val)) | (Product.name.ilike(f"%{not_bought_val}%"))
        ).subquery()
        query = query.filter(~Customer.id.in_(subq))

    # 8. inactive_days (e.g. 90)
    # Customers whose latest order date is older than X days, or who have no orders and signed up older than X days
    if "inactive_days" in filters and filters["inactive_days"] is not None:
        try:
            days = int(filters["inactive_days"])
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            # Subquery of customers who have recent orders (ordered in last X days)
            recent_order_subq = db.query(Order.customer_id).filter(Order.order_date >= cutoff_date).subquery()
            
            # Inactive means: they do not have a recent order
            query = query.filter(~Customer.id.in_(recent_order_subq))
        except (ValueError, TypeError):
            pass

    return query

def get_segment_stats(db: Session, filters: dict) -> tuple[int, float, list[Customer]]:
    """
    Runs the customer query with the filters and returns:
    - Audience size (int)
    - Average total spend of matching customers (float)
    - List of matching customers (limit 100 for display)
    """
    query = build_customer_query(db, filters)
    customers = query.all()
    size = len(customers)
    
    if size == 0:
        return 0, 0.0, []
        
    total_spend_sum = sum(c.total_spend for c in customers)
    avg_spend = round(total_spend_sum / size, 2)
    
    # Return first 100 customers for preview
    return size, avg_spend, customers[:100]
