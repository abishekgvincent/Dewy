import logging
from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.dataset import Dataset
from app.services.dataset_service import ingest_dataset_csvs
from app.db.seed import seed_database

router = APIRouter()
logger = logging.getLogger("datasets_route")

@router.post("/upload")
async def upload_dataset(
    name: str = Form("New Skincare Dataset"),
    preloaded: bool = Form(False),
    customers: UploadFile = File(None),
    orders: UploadFile = File(None),
    products: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    try:
        # Option 1: Load Preloaded Consumer Brand Dataset
        if preloaded:
            logger.info("Loading preloaded consumer brand dataset...")
            
            # Clear campaigns, communications, events, callback logs, segments, insights, and datasets
            # BUT preserve already seeded customers, products, orders, order_items in Neon
            from app.models.callback_log import CallbackLog
            from app.models.communication_event import CommunicationEvent
            from app.models.communication import Communication
            from app.models.campaign import Campaign
            from app.models.insight import AIInsight
            from app.models.segment import Segment
            
            db.query(CallbackLog).delete()
            db.query(CommunicationEvent).delete()
            db.query(Communication).delete()
            db.query(Campaign).delete()
            db.query(AIInsight).delete()
            db.query(Segment).delete()
            db.query(Dataset).delete()
            db.commit()
            
            # Verify if database has customers, if completely empty run seed_database as fallback
            from app.models.customer import Customer
            from app.models.product import Product
            from app.models.order import Order
            from app.models.orderitem import OrderItem
            
            customer_count = db.query(Customer).count()
            if customer_count == 0:
                logger.info("Database completely empty, running fallback database seed...")
                seed_database()
                
            # Query calculated counts
            from app.services.dataset_service import run_customer_intelligence_layer, create_intelligence_segments
            
            row_counts = {
                "customers": db.query(Customer).count(),
                "products": db.query(Product).count(),
                "orders": db.query(Order).count(),
                "order_items": db.query(OrderItem).count()
            }
            
            intel = run_customer_intelligence_layer(db, row_counts)
            create_intelligence_segments(db, intel)
            
            dataset = Dataset(
                name="Consumer Brand (Preloaded)",
                status="processed",
                row_counts=row_counts,
                schema_info={
                    "customers": {"columns": ["id", "name", "email", "phone", "city", "category_preference", "age_group", "total_spend", "persona", "signup_date"]},
                    "products": {"columns": ["id", "name", "category", "price", "refill_cycle_days"]},
                    "orders": {"columns": ["id", "customer_id", "order_amount", "order_date"]},
                    "mappings": {
                        "customer_orders": {"from": "customers.id", "to": "orders.customer_id", "type": "one-to-many"},
                        "order_items": {"from": "orders.id", "to": "order_items.order_id", "type": "one-to-many"}
                    }
                },
                intelligence_summary=intel
            )
            db.add(dataset)
            db.commit()
            db.refresh(dataset)
            return {"message": "Preloaded consumer dataset loaded", "dataset": dataset}
            
        # Option 2: Upload CSV files
        customers_content = None
        orders_content = None
        products_content = None
        
        if customers:
            customers_bytes = await customers.read()
            customers_content = customers_bytes.decode("utf-8")
            
        if orders:
            orders_bytes = await orders.read()
            orders_content = orders_bytes.decode("utf-8")
            
        if products:
            products_bytes = await products.read()
            products_content = products_bytes.decode("utf-8")
            
        dataset = ingest_dataset_csvs(
            db=db,
            dataset_name=name,
            customers_csv=customers_content,
            orders_csv=orders_content,
            products_csv=products_content
        )
        
        return {"message": "Dataset successfully uploaded and processed", "dataset": dataset}
        
    except Exception as e:
        logger.error(f"Failed to upload dataset: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Dataset processing failed: {str(e)}")


@router.get("/")
def get_datasets(db: Session = Depends(get_db)):
    # Query datasets order by created_at desc
    datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
    
    # If no datasets exist yet, create a dummy listing or seed preloaded listing
    if not datasets:
        # Load standard preloaded listing as initial state if database is empty
        pass
        
    return datasets


@router.get("/{id}")
def get_dataset_detail(id: int, db: Session = Depends(get_db)):
    dataset = db.query(Dataset).filter(Dataset.id == id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset
