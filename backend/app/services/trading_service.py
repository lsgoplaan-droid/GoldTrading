from datetime import datetime, date
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.trading import Trade, Position, Counterparty
from app.schemas.trading import (
    TradeCreate, TradeUpdate, TradeStatusUpdate,
    CounterpartyCreate, CounterpartyUpdate,
    TradeResponse, PositionResponse, PnLSummary,
)
from app.utils.calculations import calculate_unrealized_pnl


def _generate_trade_ref(db: Session) -> str:
    today = date.today().strftime("%Y%m%d")
    count = db.query(Trade).filter(Trade.trade_ref.like(f"TRD-{today}%")).count()
    return f"TRD-{today}-{count + 1:04d}"


# --- Counterparties ---

def get_counterparties(db: Session, active_only: bool = True) -> List[Counterparty]:
    query = db.query(Counterparty)
    if active_only:
        query = query.filter(Counterparty.is_active == True)
    return query.order_by(Counterparty.name).all()


def get_counterparty(db: Session, counterparty_id: int) -> Optional[Counterparty]:
    return db.query(Counterparty).filter(Counterparty.id == counterparty_id).first()


def create_counterparty(db: Session, data: CounterpartyCreate) -> Counterparty:
    cp = Counterparty(**data.model_dump())
    db.add(cp)
    db.commit()
    db.refresh(cp)
    return cp


def update_counterparty(db: Session, counterparty_id: int, data: CounterpartyUpdate) -> Optional[Counterparty]:
    cp = get_counterparty(db, counterparty_id)
    if not cp:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(cp, key, val)
    db.commit()
    db.refresh(cp)
    return cp


# --- Trades ---

def get_trades(
    db: Session,
    status: Optional[str] = None,
    counterparty_id: Optional[int] = None,
    limit: int = 100,
) -> List[Trade]:
    query = db.query(Trade).options(joinedload(Trade.counterparty))
    if status:
        query = query.filter(Trade.status == status)
    if counterparty_id:
        query = query.filter(Trade.counterparty_id == counterparty_id)
    return query.order_by(Trade.created_at.desc()).limit(limit).all()


def get_trade(db: Session, trade_id: int) -> Optional[Trade]:
    return db.query(Trade).options(joinedload(Trade.counterparty)).filter(Trade.id == trade_id).first()


def create_trade(db: Session, data: TradeCreate) -> Trade:
    trade_ref = _generate_trade_ref(db)
    total_value = round(data.quantity_oz * data.price_per_oz, 2)
    trade = Trade(
        trade_ref=trade_ref,
        total_value=total_value,
        status="PENDING",
        **data.model_dump(),
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)

    # Update position
    _update_position_on_trade(db, trade)

    return db.query(Trade).options(joinedload(Trade.counterparty)).filter(Trade.id == trade.id).first()


def update_trade(db: Session, trade_id: int, data: TradeUpdate) -> Optional[Trade]:
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(trade, key, val)
    db.commit()
    db.refresh(trade)
    return trade


def update_trade_status(db: Session, trade_id: int, data: TradeStatusUpdate) -> Optional[Trade]:
    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade:
        return None

    valid_transitions = {
        "PENDING": ["CONFIRMED", "CANCELLED"],
        "CONFIRMED": ["SETTLED", "CANCELLED"],
    }
    allowed = valid_transitions.get(trade.status, [])
    if data.status not in allowed:
        raise ValueError(f"Cannot transition from {trade.status} to {data.status}")

    trade.status = data.status
    if data.status == "SETTLED":
        _realize_pnl(db, trade)
    db.commit()
    db.refresh(trade)
    return trade


def _update_position_on_trade(db: Session, trade: Trade):
    account = "TRADING"
    position = db.query(Position).filter(Position.account == account).first()
    if not position:
        position = Position(account=account)
        db.add(position)
        db.flush()

    qty = trade.quantity_oz if trade.trade_type == "BUY" else -trade.quantity_oz

    if position.net_quantity_oz == 0:
        position.avg_cost_per_oz = trade.price_per_oz
    elif (position.net_quantity_oz > 0 and qty > 0) or (position.net_quantity_oz < 0 and qty < 0):
        total_cost = position.avg_cost_per_oz * abs(position.net_quantity_oz) + trade.price_per_oz * abs(qty)
        total_qty = abs(position.net_quantity_oz) + abs(qty)
        position.avg_cost_per_oz = total_cost / total_qty if total_qty != 0 else 0

    position.net_quantity_oz += qty
    db.commit()


def _realize_pnl(db: Session, trade: Trade):
    account = "TRADING"
    position = db.query(Position).filter(Position.account == account).first()
    if not position:
        return
    qty = trade.quantity_oz if trade.trade_type == "SELL" else trade.quantity_oz
    pnl = (trade.price_per_oz - position.avg_cost_per_oz) * qty
    if trade.trade_type == "BUY":
        pnl = -pnl
    position.realized_pnl += round(pnl, 2)
    db.commit()


# --- Positions ---

def get_positions(db: Session, current_price: float) -> List[PositionResponse]:
    positions = db.query(Position).all()
    result = []
    for p in positions:
        unrealized = calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, current_price)
        result.append(PositionResponse(
            id=p.id,
            account=p.account,
            net_quantity_oz=p.net_quantity_oz,
            avg_cost_per_oz=round(p.avg_cost_per_oz, 2),
            realized_pnl=round(p.realized_pnl, 2),
            unrealized_pnl=unrealized,
            current_price=current_price,
            total_value=round(p.net_quantity_oz * current_price, 2),
            updated_at=p.updated_at,
        ))
    return result


def get_pnl_summary(db: Session, current_price: float) -> PnLSummary:
    positions = db.query(Position).all()
    total_realized = sum(p.realized_pnl for p in positions)
    total_unrealized = sum(
        calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, current_price)
        for p in positions
    )
    return PnLSummary(
        total_realized_pnl=round(total_realized, 2),
        total_unrealized_pnl=round(total_unrealized, 2),
        total_pnl=round(total_realized + total_unrealized, 2),
        current_price=current_price,
    )
