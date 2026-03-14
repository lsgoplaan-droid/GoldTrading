from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.trading import (
    TradeCreate, TradeUpdate, TradeStatusUpdate, TradeResponse,
    CounterpartyCreate, CounterpartyUpdate, CounterpartyResponse,
    PositionResponse, PnLSummary,
)
from app.services import trading_service
from app.services.price_service import PriceService

router = APIRouter(prefix="/trading", tags=["Trading"])


# --- Counterparties ---

@router.get("/counterparties", response_model=List[CounterpartyResponse])
def list_counterparties(db: Session = Depends(get_db)):
    return trading_service.get_counterparties(db)


@router.post("/counterparties", response_model=CounterpartyResponse, status_code=201)
def create_counterparty(data: CounterpartyCreate, db: Session = Depends(get_db)):
    return trading_service.create_counterparty(db, data)


@router.put("/counterparties/{counterparty_id}", response_model=CounterpartyResponse)
def update_counterparty(counterparty_id: int, data: CounterpartyUpdate, db: Session = Depends(get_db)):
    result = trading_service.update_counterparty(db, counterparty_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Counterparty not found")
    return result


# --- Trades ---

@router.get("/trades", response_model=List[TradeResponse])
def list_trades(
    status: Optional[str] = None,
    counterparty_id: Optional[int] = None,
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
):
    return trading_service.get_trades(db, status, counterparty_id, limit)


@router.get("/trades/{trade_id}", response_model=TradeResponse)
def get_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = trading_service.get_trade(db, trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    return trade


@router.post("/trades", response_model=TradeResponse, status_code=201)
def create_trade(data: TradeCreate, db: Session = Depends(get_db)):
    return trading_service.create_trade(db, data)


@router.put("/trades/{trade_id}", response_model=TradeResponse)
def update_trade(trade_id: int, data: TradeUpdate, db: Session = Depends(get_db)):
    result = trading_service.update_trade(db, trade_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Trade not found")
    return result


@router.patch("/trades/{trade_id}/status", response_model=TradeResponse)
def update_trade_status(trade_id: int, data: TradeStatusUpdate, db: Session = Depends(get_db)):
    try:
        result = trading_service.update_trade_status(db, trade_id, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not result:
        raise HTTPException(status_code=404, detail="Trade not found")
    return result


# --- Positions & P&L ---

@router.get("/positions", response_model=List[PositionResponse])
async def list_positions(db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    return trading_service.get_positions(db, price_data.price)


@router.get("/pnl", response_model=PnLSummary)
async def get_pnl(db: Session = Depends(get_db)):
    price_data = await PriceService.get_current_price(db)
    return trading_service.get_pnl_summary(db, price_data.price)
