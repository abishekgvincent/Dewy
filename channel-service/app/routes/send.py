import os
import time
import random
import requests
import logging
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()
logger = logging.getLogger("simulator_send")

class SendRequest(BaseModel):
    campaign_id: int
    customer_id: int
    communication_id: int
    channel: str
    message: str

def simulate_communication_funnel(comm_id: int):
    """
    Simulates the communication funnel asynchronously:
    - 90% Delivered
    - 70% Opened (if delivered)
    - 30% Clicked (if opened)
    - 10% Purchased (if clicked)
    With random delays between each step.
    Callbacks are sent to CRM backend callback endpoint.
    """
    crm_url = os.getenv("CRM_CALLBACK_URL", "http://localhost:8000/receipt").strip()
    
    # 1. Wait briefly (simulation of delivery network latency)
    time.sleep(random.uniform(0.5, 1.5))
    
    # 2. Roll for DELIVERED (90%)
    is_delivered = random.random() < 0.90
    if not is_delivered:
        # FAILED
        try:
            requests.post(crm_url, json={"communication_id": comm_id, "event": "FAILED"}, timeout=5)
        except Exception as e:
            logger.error(f"Failed to post FAILED callback for comm {comm_id}: {e}")
        return
        
    try:
        requests.post(crm_url, json={"communication_id": comm_id, "event": "DELIVERED"}, timeout=5)
    except Exception as e:
        logger.error(f"Failed to post DELIVERED callback for comm {comm_id}: {e}")
        
    # 3. Roll for OPENED (70% if delivered)
    time.sleep(random.uniform(0.5, 2.0))
    is_opened = random.random() < 0.70
    if not is_opened:
        return
        
    try:
        requests.post(crm_url, json={"communication_id": comm_id, "event": "OPENED"}, timeout=5)
    except Exception as e:
        logger.error(f"Failed to post OPENED callback for comm {comm_id}: {e}")
        
    # 4. Roll for CLICKED (30% if opened)
    time.sleep(random.uniform(0.5, 2.0))
    is_clicked = random.random() < 0.30
    if not is_clicked:
        return
        
    try:
        requests.post(crm_url, json={"communication_id": comm_id, "event": "CLICKED"}, timeout=5)
    except Exception as e:
        logger.error(f"Failed to post CLICKED callback for comm {comm_id}: {e}")
        
    # 5. Roll for PURCHASED (10% if clicked)
    time.sleep(random.uniform(0.5, 2.5))
    is_purchased = random.random() < 0.10
    if not is_purchased:
        return
        
    try:
        requests.post(crm_url, json={"communication_id": comm_id, "event": "PURCHASED"}, timeout=5)
    except Exception as e:
        logger.error(f"Failed to post PURCHASED callback for comm {comm_id}: {e}")


@router.post("/")
def send_message(payload: SendRequest, background_tasks: BackgroundTasks) -> dict[str, str]:
    # Queue up the asynchronous callback simulator
    background_tasks.add_task(simulate_communication_funnel, payload.communication_id)
    return {"status": "accepted", "communication_id": str(payload.communication_id)}
