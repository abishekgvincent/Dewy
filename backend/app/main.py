from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.models import * # Ensure all models are imported for metadata creation
from app.routes import ai, campaigns, customers, receipt, products, orders, stats, datasets

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(title="Dewy API", lifespan=lifespan)

# Configure CORS to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(customers.router, prefix="/customers", tags=["customers"])
app.include_router(products.router, prefix="/products", tags=["products"])
app.include_router(orders.router, prefix="/orders", tags=["orders"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["campaigns"])
app.include_router(datasets.router, prefix="/datasets", tags=["datasets"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(receipt.router, prefix="/receipt", tags=["receipt"])
app.include_router(receipt.router, prefix="/api/receipts", tags=["receipt"])
app.include_router(stats.router, prefix="/stats", tags=["stats"])

@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
