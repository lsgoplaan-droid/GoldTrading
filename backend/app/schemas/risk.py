from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class RiskLimitBase(BaseModel):
    limit_type: str
    limit_name: str
    max_value: float
    currency: str = "USD"


class RiskLimitCreate(RiskLimitBase):
    pass


class RiskLimitUpdate(BaseModel):
    max_value: Optional[float] = None
    is_active: Optional[bool] = None


class RiskLimitResponse(RiskLimitBase):
    id: int
    current_value: float
    is_active: bool
    breached: bool
    utilization_pct: float = 0.0
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class MarginAccountResponse(BaseModel):
    id: int
    counterparty_id: int
    counterparty_name: Optional[str] = None
    required_margin: float
    posted_margin: float
    margin_call_amount: float
    last_call_date: Optional[date] = None

    model_config = {"from_attributes": True}


class VaRResponse(BaseModel):
    var_95: float
    var_99: float
    confidence_level: float
    horizon_days: int
    position_value: float
    calculation_date: datetime


class ExposureResponse(BaseModel):
    gross_long: float
    gross_short: float
    net_exposure: float
    net_exposure_oz: float
    current_price: float


class MtMResponse(BaseModel):
    positions: List[dict]
    total_market_value: float
    total_cost_basis: float
    total_unrealized_pnl: float
    current_price: float
    timestamp: datetime


class RiskAlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    message: str
    is_acknowledged: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class StressScenarioBase(BaseModel):
    name: str
    price_shock_pct: float
    description: Optional[str] = None


class StressScenarioCreate(StressScenarioBase):
    pass


class StressScenarioResponse(StressScenarioBase):
    id: int
    result_pnl: Optional[float] = None
    last_run_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class StressTestResult(BaseModel):
    scenario_name: str
    price_shock_pct: float
    current_price: float
    shocked_price: float
    pnl_impact: float
    positions_affected: int
