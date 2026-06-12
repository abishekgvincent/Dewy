def calculate_campaign_status(sent_count: int, failed_count: int) -> str:
    if failed_count and failed_count >= sent_count:
        return "failed"
    if sent_count > 0:
        return "active"
    return "draft"
