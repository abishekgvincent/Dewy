from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.orderitem import OrderItem
from app.models.segment import Segment
from app.models.campaign import Campaign
from app.models.communication import Communication
from app.models.communication_event import CommunicationEvent
from app.models.insight import AIInsight

__all__ = [
    "Customer",
    "Product",
    "Order",
    "OrderItem",
    "Segment",
    "Campaign",
    "Communication",
    "CommunicationEvent",
    "AIInsight",
]
