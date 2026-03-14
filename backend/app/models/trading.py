from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Counterparty(Base):
    __tablename__ = "counterparties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    type = Column(String(50), nullable=False, default="CLIENT")
    credit_rating = Column(String(10), nullable=True)
    credit_limit = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    trades = relationship("Trade", back_populates="counterparty")
    allocations = relationship("Allocation", back_populates="counterparty")
    margin_accounts = relationship("MarginAccount", back_populates="counterparty")


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    trade_ref = Column(String(20), unique=True, nullable=False)
    trade_type = Column(String(10), nullable=False)  # BUY / SELL
    product_type = Column(String(10), nullable=False, default="SPOT")  # SPOT / FORWARD
    counterparty_id = Column(Integer, ForeignKey("counterparties.id"), nullable=False)
    quantity_oz = Column(Float, nullable=False)
    price_per_oz = Column(Float, nullable=False)
    total_value = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    trade_date = Column(Date, nullable=False)
    settlement_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="PENDING")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    counterparty = relationship("Counterparty", back_populates="trades")


class Position(Base):
    __tablename__ = "positions"

    id = Column(Integer, primary_key=True, index=True)
    account = Column(String(50), nullable=False, unique=True)
    net_quantity_oz = Column(Float, default=0.0)
    avg_cost_per_oz = Column(Float, default=0.0)
    realized_pnl = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
