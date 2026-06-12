import time
import requests

CRM_URL = "http://127.0.0.1:8000"

def run_test():
    print("Testing E2E campaign flow...")
    
    # 1. Check health
    res = requests.get(f"{CRM_URL}/health")
    print(f"Health status: {res.json()}")
    
    # 2. Test AI segmentation preview
    print("\nPreviewing AI segmentation...")
    seg_res = requests.post(f"{CRM_URL}/ai/segment", json={
        "prompt": "Win back customers who haven't purchased in 90 days"
    })
    segment_data = seg_res.json()
    print(f"AI Segment Name: {segment_data['segment_name']}")
    print(f"Filters parsed: {segment_data['filters']}")
    print(f"Audience size: {segment_data['audience_size']}")
    print(f"Average customer spend: ${segment_data['average_spend']}")
    print(f"Sample customer: {segment_data['customers'][0]['name']} ({segment_data['customers'][0]['email']})")

    # 3. Create campaign using the segment filters
    print("\nCreating campaign...")
    camp_res = requests.post(f"{CRM_URL}/campaigns/", json={
        "name": "Win Back Q2 Campaign",
        "channel": "WhatsApp",
        "message": "Hey {name}! 🌟 We miss you! Grab 15% off with code BACK15 at dewy.com",
        "segment_name": segment_data["segment_name"],
        "filters": segment_data["filters"],
        "description": "Win back customers inactive for 90+ days"
    })
    campaign = camp_res.json()
    campaign_id = campaign["id"]
    print(f"Campaign created: ID={campaign_id}, Name={campaign['name']}, Status={campaign['status']}")

    # 4. Launch campaign
    print(f"\nLaunching campaign ID {campaign_id}...")
    send_res = requests.post(f"{CRM_URL}/campaigns/send", json={"campaign_id": campaign_id})
    print(f"Launch response: {send_res.json()}")

    # 5. Monitor status for a few seconds as the simulator fires callbacks
    print("\nMonitoring delivery and conversions...")
    for i in range(10):
        time.sleep(2)
        detail_res = requests.get(f"{CRM_URL}/campaigns/{campaign_id}")
        det = detail_res.json()
        stats = det["stats"]
        print(f"Tick {i+1}: Sent={stats['sent']}, Delivered={stats['delivered']}, Opened={stats['opened']}, Clicked={stats['clicked']}, Purchased={stats['purchased']}, Revenue=${stats['revenue']}")
        
        # Check if we have dynamic AI insights generated after sending completed
        if det.get("insight"):
            print(f"AI Insight Summary: {det['insight']['summary']}")
            break

if __name__ == "__main__":
    run_test()
