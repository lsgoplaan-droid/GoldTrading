from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Vault(Base):
    __tablename__ = "vaults"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    location = Column(String(200), nullable=False)
    operator = Column(String(100), nullable=True)
    capacity_oz = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    gold_items = relationship("GoldItem", back_populates="vault")
    outgoing_shipments = relationship("Shipment", foreign_keys="Shipment.origin_vault_id", back_populates="origin_vault")
    incoming_shipments = relationship("Shipment", foreign_keys="Shipment.destination_vault_id", back_populates="destination_vault")


class GoldItem(Base):
    __tablename__ = "gold_items"

    id = Column(Integer, primary_key=True, index=True)
    serial_number = Column(String(50), unique=True, nullable=False)
    item_type = Column(String(20), nullable=False)  # BAR, COIN, GRAIN
    weight_oz = Column(Float, nullable=False)
    gross_weight_oz = Column(Float, nullable=False)
    purity = Column(Float, nullable=False)  # e.g. 0.9999
    fine_weight_oz = Column(Float, nullable=False)
    refiner = Column(String(100), nullable=True)
    assay_certificate = Column(String(100), nullable=True)
    vault_id = Column(Integer, ForeignKey("vaults.id"), nullable=False)
    status = Column(String(20), nullable=False, default="AVAILABLE")
    owner = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    vault = relationship("Vault", back_populates="gold_items")
    shipment_items = relationship("ShipmentItem", back_populates="gold_item")
    allocations = relationship("Allocation", back_populates="gold_item")


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    shipment_ref = Column(String(30), unique=True, nullable=False)
    origin_vault_id = Column(Integer, ForeignKey("vaults.id"), nullable=False)
    destination_vault_id = Column(Integer, ForeignKey("vaults.id"), nullable=False)
    carrier = Column(String(100), nullable=True)
    status = Column(String(20), nullable=False, default="PLANNED")
    departure_date = Column(Date, nullable=True)
    estimated_arrival = Column(Date, nullable=True)
    actual_arrival = Column(Date, nullable=True)
    insurance_value = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    origin_vault = relationship("Vault", foreign_keys=[origin_vault_id], back_populates="outgoing_shipments")
    destination_vault = relationship("Vault", foreign_keys=[destination_vault_id], back_populates="incoming_shipments")
    items = relationship("ShipmentItem", back_populates="shipment")


class ShipmentItem(Base):
    __tablename__ = "shipment_items"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    gold_item_id = Column(Integer, ForeignKey("gold_items.id"), nullable=False)

    shipment = relationship("Shipment", back_populates="items")
    gold_item = relationship("GoldItem", back_populates="shipment_items")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    gold_item_id = Column(Integer, ForeignKey("gold_items.id"), nullable=False)
    counterparty_id = Column(Integer, ForeignKey("counterparties.id"), nullable=False)
    allocation_type = Column(String(20), nullable=False, default="ALLOCATED")
    allocated_date = Column(Date, nullable=False)
    released_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    gold_item = relationship("GoldItem", back_populates="allocations")
    counterparty = relationship("Counterparty", back_populates="allocations")
