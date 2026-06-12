def calculate_rate(count: int, total: int) -> float:
    if total <= 0:
        return 0.0
    return round(count / total, 4)
