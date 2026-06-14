import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app import models  # noqa: F401
from app.config import settings
from app.database import Base, engine
from app.routes import router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.include_router(router)
