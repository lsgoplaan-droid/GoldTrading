from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import prices, trading, logistics, risk, dashboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)

    # Seed data if DB is empty
    from app.database import SessionLocal
    from app.models.trading import Counterparty
    db = SessionLocal()
    try:
        if db.query(Counterparty).count() == 0:
            from app.seed.seed_data import seed_all
            seed_all(db)
    finally:
        db.close()

    yield


app = FastAPI(
    title="Gold Trading Platform",
    description="POC for Gold Trading, Logistics & Risk Management",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prices.router, prefix="/api/v1")
app.include_router(trading.router, prefix="/api/v1")
app.include_router(logistics.router, prefix="/api/v1")
app.include_router(risk.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "gold-trading-platform"}
