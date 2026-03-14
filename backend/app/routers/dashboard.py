from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.common import DashboardSummary
from app.services.dashboard_service import get_dashboard_summary
from app.services.price_service import PriceService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    return get_dashboard_summary(db, price_data.price)
