from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import GoldPriceResponse, PriceHistoryPoint
from app.services.price_service import PriceService

router = APIRouter(prefix="/prices", tags=["Prices"])


@router.get("/current", response_model=GoldPriceResponse)
async def get_current_price(db: Session = Depends(get_db)):
    return await PriceService.get_current_price(db)


@router.get("/history", response_model=List[PriceHistoryPoint])
def get_price_history(days: int = Query(default=30, ge=1, le=365), db: Session = Depends(get_db)):
    return PriceService.get_price_history(db, days)
