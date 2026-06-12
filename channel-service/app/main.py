from fastapi import FastAPI

from app.routes import send

app = FastAPI(title="Dewy Channel Service")

app.include_router(send.router, prefix="/send", tags=["send"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
