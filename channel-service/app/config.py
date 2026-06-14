import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    app_name: str = os.getenv("CHANNEL_SERVICE_APP_NAME", "Dewy Channel Service").strip()
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./channel_service.db").strip()
    crm_callback_url: str = os.getenv(
        "CRM_CALLBACK_URL",
        "http://localhost:8000/api/receipts",
    ).strip()
    callback_timeout_seconds: float = float(os.getenv("CALLBACK_TIMEOUT_SECONDS", "10"))
    delivered_delay_seconds: float = float(os.getenv("DELIVERED_DELAY_SECONDS", "2"))
    opened_delay_seconds: float = float(os.getenv("OPENED_DELAY_SECONDS", "5"))
    read_delay_seconds: float = float(os.getenv("READ_DELAY_SECONDS", "8"))
    clicked_delay_seconds: float = float(os.getenv("CLICKED_DELAY_SECONDS", "12"))
    retry_delays_seconds: tuple[int, int, int] = (5, 15, 45)


settings = Settings()
