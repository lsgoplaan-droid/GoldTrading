import time
import random
import httpx
from datetime import datetime, timedelta
from typing import Optional, List

from sqlalchemy.orm import Session

from app.config import settings
from app.models.risk import PriceHistory
from app.schemas.common import GoldPriceResponse, PriceHistoryPoint


class PriceService:
    _cache: Optional[dict] = None
    _base_mock_price: float = 2650.0

    @classmethod
    def _is_cache_valid(cls) -> bool:
        if cls._cache is None:
            return False
        elapsed = time.time() - cls._cache["fetched_at"]
        return elapsed < settings.PRICE_CACHE_TTL_SECONDS

    @classmethod
    def _get_mock_price(cls) -> GoldPriceResponse:
        change = random.uniform(-15, 15)
        price = cls._base_mock_price + change
        return GoldPriceResponse(
            price=round(price, 2),
            prev_close=cls._base_mock_price,
            change=round(change, 2),
            change_pct=round((change / cls._base_mock_price) * 100, 3),
            timestamp=datetime.utcnow(),
            source="mock",
        )

    @classmethod
    async def _fetch_from_goldapi(cls) -> Optional[GoldPriceResponse]:
        if not settings.GOLD_API_KEY:
            return None
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{settings.GOLD_API_BASE_URL}/XAU/USD",
                    headers={
                        "x-access-token": settings.GOLD_API_KEY,
                        "Content-Type": "application/json",
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    return GoldPriceResponse(
                        price=data.get("price", 0),
                        prev_close=data.get("prev_close_price"),
                        change=data.get("ch"),
                        change_pct=data.get("chp"),
                        timestamp=datetime.utcnow(),
                        source="goldapi",
                    )
        except Exception:
            pass
        return None

    @classmethod
    async def get_current_price(cls, db: Session) -> GoldPriceResponse:
        if cls._is_cache_valid():
            return GoldPriceResponse(**cls._cache["data"])

        price_data = None
        if not settings.USE_MOCK_PRICES:
            price_data = await cls._fetch_from_goldapi()

        if price_data is None:
            price_data = cls._get_mock_price()

        # Save to history
        history_entry = PriceHistory(
            metal="XAU",
            price_usd=price_data.price,
            currency="USD",
            timestamp=price_data.timestamp,
        )
        db.add(history_entry)
        db.commit()

        # Update cache
        cls._cache = {
            "data": price_data.model_dump(),
            "fetched_at": time.time(),
        }
        # Fix datetime serialization in cache
        cls._cache["data"]["timestamp"] = price_data.timestamp

        return price_data

    @classmethod
    def get_price_history(cls, db: Session, days: int = 30) -> List[PriceHistoryPoint]:
        cutoff = datetime.utcnow() - timedelta(days=days)
        records = (
            db.query(PriceHistory)
            .filter(PriceHistory.timestamp >= cutoff)
            .order_by(PriceHistory.timestamp.asc())
            .all()
        )
        return [
            PriceHistoryPoint(price=r.price_usd, timestamp=r.timestamp)
            for r in records
        ]

    @classmethod
    def get_latest_price_from_db(cls, db: Session) -> float:
        record = (
            db.query(PriceHistory)
            .order_by(PriceHistory.timestamp.desc())
            .first()
        )
        return record.price_usd if record else 2650.0
