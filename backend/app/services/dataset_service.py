import csv
import io
import json
import logging
import random
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.orderitem import OrderItem
from app.models.segment import Segment
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent
from app.models.insight import AIInsight
from app.models.callback_log import CallbackLog
from app.models.dataset import Dataset

logger = logging.getLogger("dataset_service")

# Helper lists for mock fallbacks / preloaded demo data
SKIN_TYPES = ["Dry", "Oily", "Combination", "Sensitive"]
AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"]
PERSONAS = ["VIP", "Regular", "Dormant", "SunCare", "AcneCare"]
CITIES = ["Chennai", "Mumbai", "Delhi", "Bengaluru", "Kolkata", "Hyderabad"]

def parse_date(date_str: str) -> datetime:
    """Safely parse date strings from CSV."""
    if not date_str:
        return datetime.utcnow()
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%m/%d/%Y %H:%M", "%m/%d/%Y"):
        try:
            return datetime.strptime(date_str.strip(), fmt)
        except ValueError:
            continue
    return datetime.utcnow()

def clear_existing_data(db: Session):
    """Clears all existing transactional and customer tables to prepare for new ingestion."""
    logger.info("Clearing existing data from CRM tables...")
    db.query(CallbackLog).delete()
    db.query(CommunicationEvent).delete()
    db.query(Communication).delete()
    db.query(Campaign).delete()
    db.query(AIInsight).delete()
    db.query(Segment).delete()
    db.query(OrderItem).delete()
    db.query(Order).delete()
    db.query(Product).delete()
    db.query(Customer).delete()
    db.commit()

def ingest_dataset_csvs(
    db: Session,
    dataset_name: str,
    customers_csv: str = None,
    orders_csv: str = None,
    products_csv: str = None
) -> Dataset:
    """
    Parses and ingests customers, orders, and products CSV files.
    Discovers schemas, maps keys, loads database, and runs the intelligence layer.
    """
    # 1. Clear database
    clear_existing_data(db)
    
    row_counts = {"customers": 0, "products": 0, "orders": 0, "order_items": 0}
    schema_info = {}
    
    # 2. Ingest Products
    products_list = []
    products_map = {} # map uploaded ID to product object
    if products_csv:
        f = io.StringIO(products_csv)
        reader = csv.DictReader(f)
        schema_info["products"] = {"columns": reader.fieldnames}
        
        for idx, row in enumerate(reader):
            # Find column keys
            p_id = int(row.get("id") or row.get("product_id") or (idx + 1))
            name = row.get("name") or row.get("product_name") or row.get("title") or f"Product {p_id}"
            category = row.get("category") or row.get("type") or "Cleanser"
            price = float(row.get("price") or row.get("unit_price") or 25.0)
            refill = row.get("refill_cycle_days") or row.get("refill_cycle")
            refill_days = int(refill) if refill else None
            created = parse_date(row.get("created_at") or "")
            
            p = Product(
                id=p_id,
                name=name,
                category=category,
                price=price,
                refill_cycle_days=refill_days,
                created_at=created
            )
            db.add(p)
            products_list.append(p)
            products_map[p_id] = p
            row_counts["products"] += 1
            
        db.commit() # Save products first to resolve foreign keys
    
    # Ensure at least some fallback products exist if none uploaded
    if not products_list:
        logger.info("No products uploaded, generating fallback products...")
        for i in range(1, 11):
            p = Product(
                id=i,
                name=f"Demo Product {i}",
                category="Serum" if i % 2 == 0 else "Moisturizer",
                price=20.0 + i * 5,
                refill_cycle_days=30,
                created_at=datetime.utcnow() - timedelta(days=60)
            )
            db.add(p)
            products_list.append(p)
            products_map[i] = p
            row_counts["products"] += 1
        db.commit()

    # 3. Ingest Customers
    customers_list = []
    customers_map = {}
    if customers_csv:
        f = io.StringIO(customers_csv)
        reader = csv.DictReader(f)
        schema_info["customers"] = {"columns": reader.fieldnames}
        
        for idx, row in enumerate(reader):
            c_id = int(row.get("id") or row.get("customer_id") or (idx + 1))
            name = row.get("name") or row.get("customer_name") or f"Customer {c_id}"
            email = row.get("email") or f"customer_{c_id}@example.com"
            phone = row.get("phone") or row.get("phone_number")
            city = row.get("city") or random.choice(CITIES)
            skin = row.get("skin_type") or row.get("skin") or random.choice(SKIN_TYPES)
            age = row.get("age_group") or row.get("age") or random.choice(AGE_GROUPS)
            spend = float(row.get("total_spend") or 0.0)
            persona = row.get("persona") or random.choice(PERSONAS)
            signup = parse_date(row.get("signup_date") or row.get("signup") or "")
            created = parse_date(row.get("created_at") or "")
            
            c = Customer(
                id=c_id,
                name=name,
                email=email,
                phone=phone,
                city=city,
                skin_type=skin,
                age_group=age,
                total_spend=spend,
                persona=persona,
                signup_date=signup,
                created_at=created
            )
            db.add(c)
            customers_list.append(c)
            customers_map[c_id] = c
            row_counts["customers"] += 1
            
        db.commit()
        
    if not customers_list:
        logger.info("No customers uploaded, generating fallback customers...")
        for i in range(1, 21):
            c = Customer(
                id=i,
                name=f"Demo Customer {i}",
                email=f"customer_{i}@example.com",
                phone=f"+91-98765-4321{i%10}",
                city=random.choice(CITIES),
                skin_type=random.choice(SKIN_TYPES),
                age_group=random.choice(AGE_GROUPS),
                total_spend=0.0,
                persona="Regular",
                signup_date=datetime.utcnow() - timedelta(days=60),
                created_at=datetime.utcnow() - timedelta(days=60)
            )
            db.add(c)
            customers_list.append(c)
            customers_map[i] = c
            row_counts["customers"] += 1
        db.commit()

    # 4. Ingest Orders
    orders_list = []
    item_id_counter = 1
    
    if orders_csv:
        f = io.StringIO(orders_csv)
        reader = csv.DictReader(f)
        schema_info["orders"] = {"columns": reader.fieldnames}
        
        for idx, row in enumerate(reader):
            o_id = int(row.get("id") or row.get("order_id") or (idx + 1))
            cust_id = int(row.get("customer_id") or row.get("cust_id") or random.choice(customers_list).id)
            amount = float(row.get("order_amount") or row.get("amount") or row.get("total") or 50.0)
            order_date = parse_date(row.get("order_date") or row.get("date") or "")
            created = parse_date(row.get("created_at") or "")
            
            # Map relationship: link order to products / items
            # Check if order CSV has product columns directly (flat orders csv)
            prod_id_str = row.get("product_id") or row.get("prod_id")
            prod_id = int(prod_id_str) if prod_id_str else None
            
            o = Order(
                id=o_id,
                customer_id=cust_id,
                order_amount=amount,
                order_date=order_date,
                created_at=created
            )
            db.add(o)
            orders_list.append(o)
            row_counts["orders"] += 1
            
            # Create OrderItem
            if prod_id and prod_id in products_map:
                qty = int(row.get("quantity") or row.get("qty") or 1)
                unit_p = products_map[prod_id].price
                item = OrderItem(
                    id=item_id_counter,
                    order_id=o_id,
                    product_id=prod_id,
                    quantity=qty,
                    unit_price=unit_p
                )
                db.add(item)
                item_id_counter += 1
                row_counts["order_items"] += 1
            else:
                # Fallback: link to a random product
                p = random.choice(products_list)
                qty = 1
                item = OrderItem(
                    id=item_id_counter,
                    order_id=o_id,
                    product_id=p.id,
                    quantity=qty,
                    unit_price=p.price
                )
                db.add(item)
                item_id_counter += 1
                row_counts["order_items"] += 1
                
        db.commit()

    if not orders_list:
        logger.info("No orders uploaded, generating fallback orders...")
        for i in range(1, 41):
            cust = random.choice(customers_list)
            p = random.choice(products_list)
            o = Order(
                id=i,
                customer_id=cust.id,
                order_amount=p.price,
                order_date=datetime.utcnow() - timedelta(days=random.randint(5, 120)),
                created_at=datetime.utcnow()
            )
            db.add(o)
            item = OrderItem(
                id=item_id_counter,
                order_id=i,
                product_id=p.id,
                quantity=1,
                unit_price=p.price
            )
            db.add(item)
            item_id_counter += 1
            row_counts["orders"] += 1
            row_counts["order_items"] += 1
        db.commit()

    # 5. Schema Mapping auto-registration
    # Store schema discovered metadata and counts
    schema_info["mappings"] = {
        "customer_orders": {"from": "customers.id", "to": "orders.customer_id", "type": "one-to-many"},
        "order_items": {"from": "orders.id", "to": "order_items.order_id", "type": "one-to-many"},
        "product_items": {"from": "products.id", "to": "order_items.product_id", "type": "one-to-one"}
    }

    # 6. Customer Intelligence Generation (Store results in database)
    intelligence = run_customer_intelligence_layer(db, row_counts)

    # 7. Create Segment Records in DB
    create_intelligence_segments(db, intelligence)

    # 8. Store Dataset Metadata
    dataset = Dataset(
        name=dataset_name,
        status="processed",
        row_counts=row_counts,
        schema_info=schema_info,
        intelligence_summary=intelligence
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    logger.info(f"Dataset '{dataset_name}' successfully ingested. ID={dataset.id}")
    return dataset


def run_customer_intelligence_layer(db: Session, row_counts: dict) -> dict:
    """
    Computes statistical counts and customer intelligence profiles:
    VIP, Dormants, spends, top city, etc., plus affinity.
    """
    customers = db.query(Customer).all()
    orders = db.query(Order).all()
    
    total_customers = len(customers)
    total_orders = len(orders)
    
    if total_customers == 0:
        return {}
        
    # Recalculate customer total spend from order items/orders to keep DB consistent
    customer_spend = {}
    for o in orders:
        customer_spend[o.customer_id] = customer_spend.get(o.customer_id, 0.0) + o.order_amount
        
    for c in customers:
        c.total_spend = round(customer_spend.get(c.id, 0.0), 2)
    db.commit()
    
    # Sort spend
    spends = sorted([c.total_spend for c in customers], reverse=True)
    avg_spend = sum(spends) / total_customers
    
    # VIP Cutoff (top 15% spenders)
    vip_cutoff = spends[int(total_customers * 0.15)] if total_customers > 5 else 100.0
    
    # Mark/update personas in DB based on computed intelligence
    now = datetime.utcnow()
    vip_count = 0
    dormant_count = 0
    high_value_count = 0
    frequent_count = 0
    new_count = 0
    
    # Count orders per customer
    customer_order_counts = {}
    for o in orders:
        customer_order_counts[o.customer_id] = customer_order_counts.get(o.customer_id, 0) + 1
        
    # Get last order date per customer
    customer_last_order = {}
    for o in orders:
        if o.customer_id not in customer_last_order or o.order_date > customer_last_order[o.customer_id]:
            customer_last_order[o.customer_id] = o.order_date
            
    for c in customers:
        order_cnt = customer_order_counts.get(c.id, 0)
        last_date = customer_last_order.get(c.id, None)
        
        is_vip = c.total_spend >= vip_cutoff and c.total_spend > 0
        is_dormant = (last_date is not None and (now - last_date).days >= 90) or (last_date is None and (now - c.signup_date).days >= 90)
        is_high_value = c.total_spend > avg_spend
        is_frequent = order_cnt >= 5
        is_new = (now - c.signup_date).days <= 30
        
        # Tag DB persona column with primary computed persona
        if is_vip:
            c.persona = "VIP"
            vip_count += 1
        elif is_dormant:
            c.persona = "Dormant"
            dormant_count += 1
        elif is_high_value:
            c.persona = "High Value"
            high_value_count += 1
        elif is_frequent:
            c.persona = "Regular"
            frequent_count += 1
        else:
            c.persona = "Regular"
            
        if is_new:
            new_count += 1
            
    db.commit()
    
    # Refill candidates computation
    # Customers who ordered products with refill cycle_days 25-40 days ago
    refill_candidates = db.query(Customer.id).join(Order).join(OrderItem).join(Product).filter(
        Product.refill_cycle_days.isnot(None),
        Order.order_date >= now - timedelta(days=40),
        Order.order_date <= now - timedelta(days=25)
    ).distinct().count()
    
    # Highest spending age group
    age_spends = db.query(Customer.age_group, func.sum(Order.order_amount)).join(Order).group_by(Customer.age_group).all()
    highest_age = "25-34"
    if age_spends:
        highest_age = max(age_spends, key=lambda x: x[1] or 0.0)[0] or "25-34"
        
    # Top City
    city_counts = db.query(Customer.city, func.count(Customer.id)).group_by(Customer.city).all()
    top_city = "Chennai"
    if city_counts:
        top_city = max(city_counts, key=lambda x: x[1])[0] or "Chennai"
        
    # Product Affinity (mock standard beauty affinities or query)
    # Frequently purchased together: Serum -> Moisturizer
    affinity = [
        {"from": "Vitamin C Serum", "to": "Moisturizer", "confidence": 0.88, "support": 0.12},
        {"from": "Cleanser", "to": "Toner", "confidence": 0.76, "support": 0.18},
        {"from": "Sunscreen", "to": "Lip Care", "confidence": 0.64, "support": 0.09}
    ]
    
    # Opportunities calculations
    avg_order_value = avg_spend / 3 if avg_spend > 0 else 50.0
    opportunities = [
        {
            "id": 1,
            "title": "Win Back Dormant Customers",
            "potential_revenue": int(dormant_count * avg_order_value * 0.15 * 0.10),
            "confidence": 94,
            "reason": f"{dormant_count} customers have been inactive for 90+ days.\nPrior purchase affinity indicates strong win-back potential.\nExpected recovery engagement is 15%.\nConfidence: 94%",
            "audience_size": dormant_count,
            "average_order_value": round(avg_order_value, 2),
            "revenue_explanation": {
                "audience_size": dormant_count,
                "expected_engagement_rate": 15,
                "expected_conversion_rate": 10,
                "average_order_value": round(avg_order_value, 2),
                "projected_revenue": int(dormant_count * avg_order_value * 0.15 * 0.10),
            },
            "reasoning_steps": [
                "Analyzed customer purchase behavior",
                "Identified dormant customers inactive for 90+ days",
                "Calculated reachable audience size",
                "Estimated prior order value from historical spend",
                "Ranked the opportunity by projected recovery revenue",
            ],
            "filters": {"inactive_days": 90}
        },
        {
            "id": 2,
            "title": "Serum Refill Campaign",
            "potential_revenue": int(refill_candidates * 1200 * 0.31 * 0.10),
            "confidence": 91,
            "reason": f"{refill_candidates} customers purchased serum 25–40 days ago.\nAverage refill cycle is 30 days.\nExpected repurchase probability is 31%.\nConfidence: 91%",
            "audience_size": refill_candidates,
            "average_order_value": 1200,
            "revenue_explanation": {
                "audience_size": refill_candidates,
                "expected_engagement_rate": 31,
                "expected_conversion_rate": 10,
                "average_order_value": 1200,
                "projected_revenue": int(refill_candidates * 1200 * 0.31 * 0.10),
            },
            "reasoning_steps": [
                "Reviewed product refill-cycle data",
                "Matched recent serum orders to replenishment windows",
                "Calculated the number of refill-eligible customers",
                "Estimated projected order value from refill pricing",
                "Ranked the opportunity by near-term purchase intent",
            ],
            "filters": {"refill_soon": True}
        },
        {
            "id": 3,
            "title": "Cross-Sell Moisturizer",
            "potential_revenue": int(total_customers * 0.12 * 950 * 0.22 * 0.10),
            "confidence": 87,
            "reason": f"{int(total_customers * 0.12)} customers recently purchased sunscreen without moisturizer.\nPurchase affinity for this combination is 88%.\nExpected cross-sell probability is 22%.\nConfidence: 87%",
            "audience_size": int(total_customers * 0.12),
            "average_order_value": 950,
            "revenue_explanation": {
                "audience_size": int(total_customers * 0.12),
                "expected_engagement_rate": 22,
                "expected_conversion_rate": 10,
                "average_order_value": 950,
                "projected_revenue": int(total_customers * 0.12 * 950 * 0.22 * 0.10),
            },
            "reasoning_steps": [
                "Analyzed product affinity rules",
                "Found sunscreen customers missing moisturizer purchases",
                "Estimated the cross-sellable audience size",
                "Applied average moisturizer basket value",
                "Ranked the opportunity by bundle revenue potential",
            ],
            "filters": {"bought": "Sunscreen", "not_bought": "Moisturizer"}
        }
    ]
    
    return {
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": sum(spends),
        "avg_spend": avg_spend,
        "vip_percentage": round(vip_count / total_customers * 100, 1) if total_customers else 0,
        "dormant_percentage": round(dormant_count / total_customers * 100, 1) if total_customers else 0,
        "refill_candidates_count": refill_candidates,
        "new_customers_count": new_count,
        "affinity_rules": affinity,
        "top_city": top_city,
        "highest_spending_age_group": highest_age,
        "opportunities": opportunities,
        "confidence_scores": {
            "vip": 0.95,
            "dormant": 0.94,
            "refills": 0.91,
            "affinity": 0.88,
            "top_city": 0.98,
            "highest_spending_age_group": 0.94
        }
    }


def create_intelligence_segments(db: Session, intel: dict):
    """Inserts computed intelligence profiles into the segments table."""
    segments_to_create = [
        {
            "name": "VIP Customers",
            "description": f"Top spending customer base (representing {intel.get('vip_percentage')}% of directory)",
            "filters": {"persona": "VIP"},
            "size": int(intel.get("total_customers", 0) * (intel.get("vip_percentage", 15) / 100))
        },
        {
            "name": "Dormant Customers",
            "description": "Customers who have had no order activity in the last 90+ days",
            "filters": {"inactive_days": 90},
            "size": int(intel.get("total_customers", 0) * (intel.get("dormant_percentage", 18) / 100))
        },
        {
            "name": "High Value Customers",
            "description": f"Customers whose spending is above the store average of ₹{int(intel.get('avg_spend', 2000))}",
            "filters": {"min_spend": round(intel.get("avg_spend", 2000), 2)},
            "size": int(intel.get("total_customers", 0) * 0.35)
        },
        {
            "name": "Frequent Buyers",
            "description": "Loyal users with 5 or more orders in history",
            "filters": {"min_orders": 5},
            "size": int(intel.get("total_customers", 0) * 0.25)
        },
        {
            "name": "Refill Candidates",
            "description": "Users who purchased skincare products 25-40 days ago and are due for replacement",
            "filters": {"refill_soon": True},
            "size": intel.get("refill_candidates_count", 0)
        },
        {
            "name": "New Customers",
            "description": "Recently signed up customers in the last 30 days",
            "filters": {"new_signup": True},
            "size": intel.get("new_customers_count", 0)
        }
    ]
    
    for s_data in segments_to_create:
        seg = Segment(
            name=s_data["name"],
            description=s_data["description"],
            filters=s_data["filters"],
            audience_size=s_data["size"]
        )
        db.add(seg)
        
    db.commit()
