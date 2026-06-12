from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from app.db.database import Base

class Communication(Base):
    __tablename__ = "communications"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), index=True, nullable=False)
    channel = Column(String, nullable=False) # WhatsApp, SMS, Email, RCS
    message = Column(Text, nullable=False)
    status = Column(String, default="Queued", nullable=False)  # Queued, Sent, Delivered, Failed, Opened, Clicked, Purchased
    sent_at = Column(DateTime, server_default=func.now(), nullable=False)
