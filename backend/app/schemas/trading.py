from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CounterpartyBase(BaseModel):
    name: str
    code: str
    type: str = "CLIENT"
    credit_rating: Optional[str] = None
    credit_limit: float = 0.0


class CounterpartyCreate(CounterpartyBase):
    pass


class CounterpartyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    credit_rating: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None


class CounterpartyResponse(CounterpartyBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TradeBase(BaseModel):
    trade_type: str  # BUY / SELL
    product_type: str = "SPOT"
    counterparty_id: int
    quantity_oz: float
    price_per_oz: float
    currency: str = "USD"
    trade_date: date
    settlement_date: date
    notes: Optional[str] = None


class TradeCreate(TradeBase):
    pass


class TradeUpdate(BaseModel):
    notes: Optional[str] = None
    settlement_date: Optional[date] = None


class TradeStatusUpdate(BaseModel):
    status: str


class TradeResponse(TradeBase):
    id: int
    trade_ref: str
    total_value: float
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    counterparty: Optional[CounterpartyResponse] = None

    model_config = {"from_attributes": True}


class PositionResponse(BaseModel):
    id: int
    account: str
    net_quantity_oz: float
    avg_cost_per_oz: float
    realized_pnl: float
    unrealized_pnl: float = 0.0
    current_price: float = 0.0
    total_value: float = 0.0
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PnLSummary(BaseModel):
    total_realized_pnl: float
    total_unrealized_pnl: float
    total_pnl: float
    current_price: float
