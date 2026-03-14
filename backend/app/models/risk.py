from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship

from app.database import Base


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    metal = Column(String(10), nullable=False, default="XAU")
    price_usd = Column(Float, nullable=False)
    currency = Column(String(3), default="USD")
    timestamp = Column(DateTime, nullable=False, index=True)


class RiskLimit(Base):
    __tablename__ = "risk_limits"

    id = Column(Integer, primary_key=True, index=True)
    limit_type = Column(String(30), nullable=False)
    limit_name = Column(String(100), nullable=False)
    max_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    currency = Column(String(3), default="USD")
    is_active = Column(Boolean, default=True)
    breached = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MarginAccount(Base):
    __tablename__ = "margin_accounts"

    id = Column(Integer, primary_key=True, index=True)
    counterparty_id = Column(Integer, ForeignKey("counterparties.id"), nullable=False)
    required_margin = Column(Float, default=0.0)
    posted_margin = Column(Float, default=0.0)
    margin_call_amount = Column(Float, default=0.0)
    last_call_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    counterparty = relationship("Counterparty", back_populates="margin_accounts")


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(30), nullable=False)
    severity = Column(String(10), nullable=False)
    message = Column(Text, nullable=False)
    is_acknowledged = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class StressScenario(Base):
    __tablename__ = "stress_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    price_shock_pct = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    result_pnl = Column(Float, nullable=True)
    last_run_at = Column(DateTime, nullable=True)
