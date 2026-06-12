from app.db.database import Base, engine
from app.models import *

Base.metadata.create_all(bind=engine)

print("Tables Created")
