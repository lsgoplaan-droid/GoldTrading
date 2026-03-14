from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class GoldPriceResponse(BaseModel):
    price: float
    prev_close: Optional[float] = None
    change: Optional[float] = None
    change_pct: Optional[float] = None
    timestamp: datetime
    source: str = "mock"


class PriceHistoryPoint(BaseModel):
    price: float
    timestamp: datetime


class ErrorResponse(BaseModel):
    detail: str


class DashboardSummary(BaseModel):
    net_position_oz: float
    unrealized_pnl: float
    realized_pnl: float
    var_95: float
    total_inventory_oz: float
    active_alerts: int
    total_trades: int
    current_gold_price: float
