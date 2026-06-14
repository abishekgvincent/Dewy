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
CATEGORIES = ["Apparel", "Electronics", "Home", "Beauty", "Sports", "Books"]

# Category Preferences and Age Groups
CATEGORY_PREFERENCES = ["Apparel", "Electronics", "Home", "Beauty"]
AGE_GROUPS = ["18-24", "25-34", "35-44", "45+"]
PERSONAS = ["VIP", "Regular", "Dormant", "TechEnthusiast", "FashionForward"]

# Product details
PRODUCT_NAME_TEMPLATES = {
    "Apparel": ["Organic Cotton T-Shirt", "Slim Fit Denim Jeans", "Classic Crewneck Sweatshirt", "Waterproof Windbreaker Jacket", "Merino Wool Socks", "Casual Canvas Sneakers", "Athletic Fleece Joggers"],
    "Electronics": ["Wireless Bluetooth Earbuds", "Noise-Canceling Headphones", "Mechanical Gaming Keyboard", "Portable Power Bank 20k", "Ultra-Wide Computer Monitor", "Smart Fitness Watch", "Dual-Band Wi-Fi Router"],
    "Home": ["Ergonomic Mesh Office Chair", "Scented Soy Wax Candle", "Ceramic Coffee Mug Set", "Memory Foam Sleeping Pillow", "Stainless Steel Water Bottle", "Adjustable Desk Lamp", "Non-Stick Frying Pan"],
    "Beauty": ["Hydrating Facial Cleanser", "Vitamin C Face Serum", "Broad Spectrum Sunscreen SPF 50", "Shea Butter Lip Balm", "Moisturizing Hand Cream", "Volumizing Hair Shampoo"],
    "Sports": ["Non-Slip Yoga Mat", "Adjustable Dumbbell Set", "High-Performance Running Shoes", "Resistance Bands Pack", "Durable Hiking Backpack"],
    "Books": ["Sci-Fi Bestselling Novel", "Productivity & Habits Guide", "Classic Literature Collection", "Cookbook for Beginners", "Mystery & Thriller Fiction"]
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
        electronics = [p for p in products if p.category == "Electronics"]
        apparel = [p for p in products if p.category == "Apparel"]
        home = [p for p in products if p.category == "Home"]
        beauty = [p for p in products if p.category == "Beauty"]
        sports = [p for p in products if p.category == "Sports"]
        other_products = [p for p in products if p.category not in ["Electronics", "Apparel"]]

        print("Seeding Customers & Orders...")
        customers = []
        orders = []
        order_items = []
        
        now = datetime.utcnow()
        
        customer_count = 1000
        # Personalities allocations
        # VIP: 150, Regular: 450, Dormant: 150, TechEnthusiast: 120, FashionForward: 130
        for i in range(customer_count):
            if i < 150:
                persona = "VIP"
                category_preference = random.choice(CATEGORY_PREFERENCES)
                age_group = random.choice(AGE_GROUPS)
            elif i < 600:
                persona = "Regular"
                category_preference = random.choice(CATEGORY_PREFERENCES)
                age_group = random.choice(AGE_GROUPS)
            elif i < 750:
                persona = "Dormant"
                category_preference = random.choice(CATEGORY_PREFERENCES)
                age_group = random.choice(AGE_GROUPS)
            elif i < 870:
                persona = "TechEnthusiast"
                category_preference = "Electronics"
                age_group = random.choice(["18-24", "25-34"])
            else:
                persona = "FashionForward"
                category_preference = "Apparel"
                age_group = random.choice(["25-34", "35-44"])
                
            signup_date = now - timedelta(days=random.randint(120, 365))
            
            c = Customer(
                id=i + 1,
                name=fake.name(),
                email=f"{fake.email().split('@')[0]}_{i+1}@example.com", # make sure unique
                phone=fake.phone_number(),
                city=fake.city(),
                category_preference=category_preference,
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
            elif c.persona == "TechEnthusiast":
                num_orders = random.randint(3, 8)
                # Buy electronics, never apparel
                for _ in range(num_orders):
                    order_dates.append(now - timedelta(days=random.randint(5, 180)))
            elif c.persona == "FashionForward":
                num_orders = random.randint(3, 8)
                # Focused on apparel and accessories
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
                if c.persona == "TechEnthusiast":
                    # Must purchase at least one electronics item, and can purchase other things except apparel
                    o_products.append(random.choice(electronics))
                    if random.random() < 0.5:
                        o_products.append(random.choice(other_products))
                elif c.persona == "FashionForward":
                    # Primarily apparel and accessories
                    o_products.append(random.choice(apparel))
                    if random.random() < 0.6:
                        o_products.append(random.choice(home))
                    if random.random() < 0.3:
                        o_products.append(random.choice(beauty))
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
