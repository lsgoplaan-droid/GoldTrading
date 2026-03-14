from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.risk import (
    VaRResponse, ExposureResponse, MtMResponse,
    RiskLimitCreate, RiskLimitUpdate, RiskLimitResponse,
    MarginAccountResponse, RiskAlertResponse,
    StressScenarioCreate, StressScenarioResponse, StressTestResult,
)
from app.services import risk_service
from app.services.price_service import PriceService

router = APIRouter(prefix="/risk", tags=["Risk Management"])


@router.get("/var", response_model=VaRResponse)
async def get_var(
    confidence: float = Query(default=0.95, ge=0.9, le=0.999),
    horizon: int = Query(default=1, ge=1, le=30),
    db: Session = Depends(get_db),
):
    price_data = await PriceService.get_current_price(db)
    return risk_service.calculate_portfolio_var(db, price_data.price, confidence, horizon)


@router.get("/exposure", response_model=ExposureResponse)
async def get_exposure(db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    return risk_service.get_exposure(db, price_data.price)


@router.get("/mtm", response_model=MtMResponse)
async def get_mtm(db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    return risk_service.get_mtm(db, price_data.price)


# --- Limits ---

@router.get("/limits", response_model=List[RiskLimitResponse])
def list_limits(db: Session = Depends(get_db)):
    return risk_service.get_risk_limits(db)


@router.post("/limits", response_model=RiskLimitResponse, status_code=201)
def create_limit(data: RiskLimitCreate, db: Session = Depends(get_db)):
    limit = risk_service.create_risk_limit(db, data)
    return RiskLimitResponse(
        id=limit.id, limit_type=limit.limit_type, limit_name=limit.limit_name,
        max_value=limit.max_value, current_value=limit.current_value,
        currency=limit.currency, is_active=limit.is_active, breached=False,
        utilization_pct=0.0, updated_at=limit.updated_at,
    )


@router.put("/limits/{limit_id}", response_model=RiskLimitResponse)
def update_limit(limit_id: int, data: RiskLimitUpdate, db: Session = Depends(get_db)):
    result = risk_service.update_risk_limit(db, limit_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Risk limit not found")
    util = (abs(result.current_value) / result.max_value * 100) if result.max_value > 0 else 0
    return RiskLimitResponse(
        id=result.id, limit_type=result.limit_type, limit_name=result.limit_name,
        max_value=result.max_value, current_value=result.current_value,
        currency=result.currency, is_active=result.is_active,
        breached=abs(result.current_value) >= result.max_value,
        utilization_pct=round(util, 1), updated_at=result.updated_at,
    )


# --- Margin ---

@router.get("/margin", response_model=List[MarginAccountResponse])
def list_margin_accounts(db: Session = Depends(get_db)):
    return risk_service.get_margin_accounts(db)


@router.post("/margin/recalculate")
async def recalculate_margins(db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    risk_service.recalculate_margins(db, price_data.price)
    return {"message": "Margins recalculated"}


# --- Alerts ---

@router.get("/alerts", response_model=List[RiskAlertResponse])
def list_alerts(
    severity: Optional[str] = None,
    acknowledged: Optional[bool] = None,
    db: Session = Depends(get_db),
):
    return risk_service.get_alerts(db, severity, acknowledged)


@router.patch("/alerts/{alert_id}/acknowledge")
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    result = risk_service.acknowledge_alert(db, alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged"}


# --- Stress Tests ---

@router.get("/stress-tests", response_model=List[StressScenarioResponse])
def list_scenarios(db: Session = Depends(get_db)):
    return risk_service.get_stress_scenarios(db)


@router.post("/stress-tests", response_model=StressScenarioResponse, status_code=201)
def create_scenario(data: StressScenarioCreate, db: Session = Depends(get_db)):
    return risk_service.create_stress_scenario(db, data)


@router.post("/stress-tests/{scenario_id}/run", response_model=StressTestResult)
async def run_stress_test(scenario_id: int, db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    try:
        return risk_service.run_stress_test(db, scenario_id, price_data.price)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
