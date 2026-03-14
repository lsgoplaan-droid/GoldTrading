from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.trading import Position
from app.models.risk import PriceHistory, RiskLimit, MarginAccount, RiskAlert, StressScenario
from app.models.trading import Counterparty, Trade
from app.schemas.risk import (
    VaRResponse, ExposureResponse, MtMResponse,
    RiskLimitCreate, RiskLimitUpdate, RiskLimitResponse,
    MarginAccountResponse, RiskAlertResponse,
    StressScenarioCreate, StressScenarioResponse, StressTestResult,
)
from app.utils.calculations import calculate_var, calculate_log_returns, calculate_unrealized_pnl


# --- VaR ---

def calculate_portfolio_var(db: Session, current_price: float, confidence: float = 0.95, horizon: int = 1) -> VaRResponse:
    prices = (
        db.query(PriceHistory.price_usd)
        .order_by(PriceHistory.timestamp.asc())
        .all()
    )
    price_list = [p[0] for p in prices]
    returns = calculate_log_returns(price_list)

    positions = db.query(Position).all()
    total_position_value = sum(p.net_quantity_oz * current_price for p in positions)

    var_95 = calculate_var(returns, 0.95, abs(total_position_value))
    var_99 = calculate_var(returns, 0.99, abs(total_position_value))

    if horizon > 1:
        import math
        var_95 *= math.sqrt(horizon)
        var_99 *= math.sqrt(horizon)

    return VaRResponse(
        var_95=round(var_95, 2),
        var_99=round(var_99, 2),
        confidence_level=confidence,
        horizon_days=horizon,
        position_value=round(total_position_value, 2),
        calculation_date=datetime.utcnow(),
    )


# --- Exposure ---

def get_exposure(db: Session, current_price: float) -> ExposureResponse:
    positions = db.query(Position).all()
    gross_long = sum(p.net_quantity_oz * current_price for p in positions if p.net_quantity_oz > 0)
    gross_short = sum(abs(p.net_quantity_oz) * current_price for p in positions if p.net_quantity_oz < 0)
    net_oz = sum(p.net_quantity_oz for p in positions)
    return ExposureResponse(
        gross_long=round(gross_long, 2),
        gross_short=round(gross_short, 2),
        net_exposure=round(net_oz * current_price, 2),
        net_exposure_oz=round(net_oz, 4),
        current_price=current_price,
    )


# --- Mark-to-Market ---

def get_mtm(db: Session, current_price: float) -> MtMResponse:
    positions = db.query(Position).all()
    pos_list = []
    total_mv = 0.0
    total_cost = 0.0
    total_upnl = 0.0

    for p in positions:
        mv = p.net_quantity_oz * current_price
        cost = p.net_quantity_oz * p.avg_cost_per_oz
        upnl = calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, current_price)
        pos_list.append({
            "account": p.account,
            "quantity_oz": p.net_quantity_oz,
            "avg_cost": round(p.avg_cost_per_oz, 2),
            "market_value": round(mv, 2),
            "cost_basis": round(cost, 2),
            "unrealized_pnl": upnl,
        })
        total_mv += mv
        total_cost += cost
        total_upnl += upnl

    return MtMResponse(
        positions=pos_list,
        total_market_value=round(total_mv, 2),
        total_cost_basis=round(total_cost, 2),
        total_unrealized_pnl=round(total_upnl, 2),
        current_price=current_price,
        timestamp=datetime.utcnow(),
    )


# --- Risk Limits ---

def get_risk_limits(db: Session) -> List[RiskLimitResponse]:
    limits = db.query(RiskLimit).filter(RiskLimit.is_active == True).all()
    result = []
    for lim in limits:
        util = (abs(lim.current_value) / lim.max_value * 100) if lim.max_value > 0 else 0
        result.append(RiskLimitResponse(
            id=lim.id, limit_type=lim.limit_type, limit_name=lim.limit_name,
            max_value=lim.max_value, current_value=lim.current_value,
            currency=lim.currency, is_active=lim.is_active,
            breached=abs(lim.current_value) >= lim.max_value,
            utilization_pct=round(util, 1),
            updated_at=lim.updated_at,
        ))
    return result


def create_risk_limit(db: Session, data: RiskLimitCreate) -> RiskLimit:
    limit = RiskLimit(**data.model_dump())
    db.add(limit)
    db.commit()
    db.refresh(limit)
    return limit


def update_risk_limit(db: Session, limit_id: int, data: RiskLimitUpdate) -> Optional[RiskLimit]:
    limit = db.query(RiskLimit).filter(RiskLimit.id == limit_id).first()
    if not limit:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(limit, key, val)
    db.commit()
    db.refresh(limit)
    return limit


# --- Margin ---

def get_margin_accounts(db: Session) -> List[MarginAccountResponse]:
    accounts = db.query(MarginAccount).options(joinedload(MarginAccount.counterparty)).all()
    return [
        MarginAccountResponse(
            id=a.id, counterparty_id=a.counterparty_id,
            counterparty_name=a.counterparty.name if a.counterparty else None,
            required_margin=a.required_margin, posted_margin=a.posted_margin,
            margin_call_amount=max(0, a.required_margin - a.posted_margin),
            last_call_date=a.last_call_date,
        )
        for a in accounts
    ]


def recalculate_margins(db: Session, current_price: float):
    positions = db.query(Position).all()
    total_exposure = sum(abs(p.net_quantity_oz) * current_price for p in positions)
    margin_rate = 0.10  # 10% margin requirement

    accounts = db.query(MarginAccount).all()
    for account in accounts:
        account.required_margin = round(total_exposure * margin_rate / max(len(accounts), 1), 2)
        account.margin_call_amount = max(0, account.required_margin - account.posted_margin)
        if account.margin_call_amount > 0:
            _create_alert(db, "MARGIN_CALL", "HIGH",
                          f"Margin call of ${account.margin_call_amount:,.2f} for counterparty ID {account.counterparty_id}")
    db.commit()


# --- Alerts ---

def get_alerts(db: Session, severity: Optional[str] = None, acknowledged: Optional[bool] = None) -> List[RiskAlertResponse]:
    query = db.query(RiskAlert)
    if severity:
        query = query.filter(RiskAlert.severity == severity)
    if acknowledged is not None:
        query = query.filter(RiskAlert.is_acknowledged == acknowledged)
    alerts = query.order_by(RiskAlert.created_at.desc()).limit(100).all()
    return [RiskAlertResponse.model_validate(a) for a in alerts]


def acknowledge_alert(db: Session, alert_id: int) -> Optional[RiskAlert]:
    alert = db.query(RiskAlert).filter(RiskAlert.id == alert_id).first()
    if not alert:
        return None
    alert.is_acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert


def _create_alert(db: Session, alert_type: str, severity: str, message: str):
    alert = RiskAlert(alert_type=alert_type, severity=severity, message=message)
    db.add(alert)


# --- Stress Tests ---

def get_stress_scenarios(db: Session) -> List[StressScenarioResponse]:
    scenarios = db.query(StressScenario).all()
    return [StressScenarioResponse.model_validate(s) for s in scenarios]


def create_stress_scenario(db: Session, data: StressScenarioCreate) -> StressScenario:
    scenario = StressScenario(**data.model_dump())
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


def run_stress_test(db: Session, scenario_id: int, current_price: float) -> StressTestResult:
    scenario = db.query(StressScenario).filter(StressScenario.id == scenario_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

    shocked_price = current_price * (1 + scenario.price_shock_pct)
    positions = db.query(Position).all()

    total_pnl_impact = 0.0
    for p in positions:
        current_pnl = calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, current_price)
        shocked_pnl = calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, shocked_price)
        total_pnl_impact += (shocked_pnl - current_pnl)

    scenario.result_pnl = round(total_pnl_impact, 2)
    scenario.last_run_at = datetime.utcnow()
    db.commit()

    return StressTestResult(
        scenario_name=scenario.name,
        price_shock_pct=scenario.price_shock_pct,
        current_price=current_price,
        shocked_price=round(shocked_price, 2),
        pnl_impact=round(total_pnl_impact, 2),
        positions_affected=len(positions),
    )
