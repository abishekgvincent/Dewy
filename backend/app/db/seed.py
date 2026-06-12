import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import Base, engine, SessionLocal
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.orderitem import OrderItem
from app.models.segment import Segment
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent
from app.models.insight import AIInsight

# Initialize Faker if available, else use custom lists
try:
    from faker import Faker
    fake = Faker()
    fake.seed_instance(42)
except ImportError:
    class Fake:
        def name(self):
            firsts = ["Emma", "Olivia", "Ava", "Isabella", "Sophia", "Mia", "Charlotte", "Amelia", "Harper", "Evelyn", "Liam", "Noah", "Oliver", "James", "Elijah", "William", "Henry", "Lucas", "Benjamin", "Alexander"]
            lasts = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"]
            return f"{random.choice(firsts)} {random.choice(lasts)}"
        def email(self):
            return f"user_{random.randint(1000, 99999)}@example.com"
        def phone_number(self):
            return f"+1-{random.randint(200, 999)}-{random.randint(200, 999)}-{random.randint(1000, 9999)}"
        def city(self):
            cities = ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "San Francisco", "Indianapolis", "Columbus", "Fort Worth", "Charlotte", "Seattle", "Denver", "El Paso"]
            return random.choice(cities)
    fake = Fake()

# Seed random for determinism
random.seed(42)

# Categories
CATEGORIES = ["Cleanser", "Serum", "Moisturizer", "Sunscreen", "Night Cream", "Lip Care", "Face Mask", "Toner"]

# Skin Types and Age Groups
SKIN_TYPES = ["Dry", "Oily", "Combination", "Sensitive"]
AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"]
PERSONAS = ["VIP", "Regular", "Dormant", "SunCare", "AcneCare"]

# Product details
PRODUCT_NAME_TEMPLATES = {
    "Cleanser": ["Hydrating Foaming Cleanser", "Glow-Boosting Cleanser", "Centella Calming Cleanser", "Salicylic Acid Purifying Gel", "Gentle Milky Wash", "Oil-to-Milk Cleansing Balm", "Soothing Tea Tree Foam"],
    "Serum": ["Super C Brightening Serum", "Hyaluronic Acid Plumping Drops", "Retinol Renewal Complex", "Niacinamide Pore-Minimizing Serum", "Snail Mucin Barrier Serum", "Bakuchiol Wrinkle Blur", "Copper Peptide Elixir"],
    "Moisturizer": ["Ceramide Rich Moisture Balm", "Water-Gel Hydrator", "Centella Soothing Cream", "Ultra-Hydrating Face Cream", "Matte Balancing Lotion", "Barrier Repair Cream", "Rosehip Daily Moisturizer"],
    "Sunscreen": ["Broad Spectrum SPF 50 Dry-Touch", "Daily Dew SPF 30 Mineral Sunscreen", "Hydrating UV Shield Gel", "Sun Glow Drops SPF 40", "Zinc Barrier Protection", "Airy Matte Sun Fluid"],
    "Night Cream": ["Overnight Recovery Cream", "Melatonin Sleeping Mask", "Pro-Collagen Restorative Cream", "Youth Boost Peptide Cream", "Soothing Cica Sleep Balm"],
    "Lip Care": ["Butter Lip Mask", "Peptide Lip Treatment", "Hydrating Lip Balm Coconut", "Shea Butter Lip Butter", "Honey Glaze Lip Gloss"],
    "Face Mask": ["Dead Sea Clay Detox Mask", "Hydrating Sheet Mask Pack", "Pumpkin Enzyme Exfoliating Peel", "Matcha Antioxidant Clay Mask", "Overnight Hydration Jelly Mask"],
    "Toner": ["AHA/BHA Exfoliating Toner", "Milky Rice Bran Toner", "Rose Water Hydrating Mist", "Witch Hazel Pore Toner", "Heartleaf Calming Liquid"]
}

def seed_database() -> None:
    print("Re-creating all tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("Seeding Products...")
        products = []
        product_count = 100
        
        # Ensure we have at least one product in each category
        for i in range(product_count):
            cat = CATEGORIES[i % len(CATEGORIES)]
            templates = PRODUCT_NAME_TEMPLATES[cat]
            name = f"{random.choice(templates)} {1 + (i // len(CATEGORIES))}"
            price = round(random.uniform(12.0, 75.0), 2)
            refill_cycle = random.choice([30, 45, 60, 90])
            
            p = Product(
                id=i + 1,
                name=name,
                category=cat,
                price=price,
                refill_cycle_days=refill_cycle,
                created_at=datetime.utcnow() - timedelta(days=random.randint(180, 365))
            )
            db.add(p)
            products.append(p)
            
        db.commit()
        print(f"Successfully seeded {len(products)} products.")
        
        # Categorize products for persona orders
        sunscreens = [p for p in products if p.category == "Sunscreen"]
        moisturizers = [p for p in products if p.category == "Moisturizer"]
        cleansers = [p for p in products if p.category == "Cleanser"]
        serums = [p for p in products if p.category == "Serum"]
        toners = [p for p in products if p.category == "Toner"]
        other_products = [p for p in products if p.category not in ["Sunscreen", "Moisturizer"]]

        print("Seeding Customers & Orders...")
        customers = []
        orders = []
        order_items = []
        
        now = datetime.utcnow()
        
        customer_count = 1000
        # Personalities allocations
        # VIP: 150, Regular: 450, Dormant: 150, SunCare: 120, AcneCare: 130
        for i in range(customer_count):
            if i < 150:
                persona = "VIP"
                skin_type = random.choice(SKIN_TYPES)
                age_group = random.choice(AGE_GROUPS)
            elif i < 600:
                persona = "Regular"
                skin_type = random.choice(SKIN_TYPES)
                age_group = random.choice(AGE_GROUPS)
            elif i < 750:
                persona = "Dormant"
                skin_type = random.choice(SKIN_TYPES)
                age_group = random.choice(AGE_GROUPS)
            elif i < 870:
                persona = "SunCare"
                skin_type = random.choice(["Combination", "Sensitive", "Dry"])
                age_group = random.choice(["25-34", "35-44"])
            else:
                persona = "AcneCare"
                skin_type = "Oily" if random.random() < 0.7 else "Combination"
                age_group = random.choice(["18-24", "25-34"])
                
            signup_date = now - timedelta(days=random.randint(120, 365))
            
            c = Customer(
                id=i + 1,
                name=fake.name(),
                email=f"{fake.email().split('@')[0]}_{i+1}@example.com", # make sure unique
                phone=fake.phone_number(),
                city=fake.city(),
                skin_type=skin_type,
                age_group=age_group,
                total_spend=0.0,  # will update after orders are calculated
                persona=persona,
                signup_date=signup_date,
                created_at=signup_date
            )
            db.add(c)
            customers.append(c)
            
        db.commit() # Save customers first to ensure foreign keys work
        
        # Helper to generate orders for a customer
        order_id_counter = 1
        item_id_counter = 1
        
        for c in customers:
            # Determine order count and dates based on persona
            order_dates = []
            if c.persona == "VIP":
                num_orders = random.randint(10, 20)
                # Spread over the last 120 days, with the last order very recent (within 10 days)
                for _ in range(num_orders - 1):
                    order_dates.append(now - timedelta(days=random.randint(11, 150)))
                order_dates.append(now - timedelta(days=random.randint(1, 10)))
            elif c.persona == "Regular":
                num_orders = random.randint(4, 10)
                # Spread over last 150 days, last order within 45 days
                for _ in range(num_orders - 1):
                    order_dates.append(now - timedelta(days=random.randint(46, 180)))
                order_dates.append(now - timedelta(days=random.randint(5, 45)))
            elif c.persona == "Dormant":
                num_orders = random.randint(2, 5)
                # All orders are older than 90 days
                for _ in range(num_orders):
                    order_dates.append(now - timedelta(days=random.randint(91, 240)))
            elif c.persona == "SunCare":
                num_orders = random.randint(3, 8)
                # Buy sunscreens, never moisturizers
                for _ in range(num_orders):
                    order_dates.append(now - timedelta(days=random.randint(5, 180)))
            elif c.persona == "AcneCare":
                num_orders = random.randint(3, 8)
                # Focused on cleansers and serums
                for _ in range(num_orders):
                    order_dates.append(now - timedelta(days=random.randint(5, 180)))
            else:
                num_orders = random.randint(1, 3)
                for _ in range(num_orders):
                    order_dates.append(now - timedelta(days=random.randint(5, 180)))
                    
            order_dates.sort()
            
            customer_total_spend = 0.0
            
            for o_date in order_dates:
                # Select products based on persona rules
                o_products = []
                if c.persona == "SunCare":
                    # Must purchase at least one sunscreen, and can purchase other things except moisturizer
                    o_products.append(random.choice(sunscreens))
                    if random.random() < 0.5:
                        o_products.append(random.choice(other_products))
                elif c.persona == "AcneCare":
                    # Primarily cleansers and serums (salicylic acid etc.)
                    o_products.append(random.choice(cleansers))
                    if random.random() < 0.6:
                        o_products.append(random.choice(serums))
                    if random.random() < 0.3:
                        o_products.append(random.choice(toners))
                elif c.persona == "VIP":
                    # Buy anything, often multiple items
                    num_items = random.randint(2, 4)
                    o_products = random.sample(products, num_items)
                else:
                    # Regular or Dormant
                    num_items = random.randint(1, 3)
                    o_products = random.sample(products, num_items)
                
                order_amount = 0.0
                order_items_temp = []
                
                for p in o_products:
                    qty = random.choice([1, 2]) if c.persona == "VIP" else 1
                    unit_p = p.price
                    item_total = round(qty * unit_p, 2)
                    order_amount += item_total
                    
                    item = OrderItem(
                        id=item_id_counter,
                        order_id=order_id_counter,
                        product_id=p.id,
                        quantity=qty,
                        unit_price=unit_p
                    )
                    order_items_temp.append(item)
                    item_id_counter += 1
                
                order_amount = round(order_amount, 2)
                customer_total_spend += order_amount
                
                order_rec = Order(
                    id=order_id_counter,
                    customer_id=c.id,
                    order_amount=order_amount,
                    order_date=o_date,
                    created_at=o_date
                )
                db.add(order_rec)
                orders.append(order_rec)
                
                for item in order_items_temp:
                    db.add(item)
                    order_items.append(item)
                
                order_id_counter += 1
                
            c.total_spend = round(customer_total_spend, 2)
            
        db.commit()
        print(f"Successfully seeded {len(orders)} orders and {len(order_items)} order items.")
        print(f"Total customers spend populated.")
        
    except Exception as e:
        db.rollback()
        print(f"Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
