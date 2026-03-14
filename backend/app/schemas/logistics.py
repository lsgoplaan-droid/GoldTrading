from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class VaultBase(BaseModel):
    name: str
    code: str
    location: str
    operator: Optional[str] = None
    capacity_oz: float = 0.0


class VaultCreate(VaultBase):
    pass


class VaultUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    operator: Optional[str] = None
    capacity_oz: Optional[float] = None
    is_active: Optional[bool] = None


class VaultResponse(VaultBase):
    id: int
    is_active: bool
    created_at: datetime
    current_holdings_oz: float = 0.0
    item_count: int = 0

    model_config = {"from_attributes": True}


class GoldItemBase(BaseModel):
    serial_number: str
    item_type: str  # BAR, COIN, GRAIN
    weight_oz: float
    gross_weight_oz: float
    purity: float
    refiner: Optional[str] = None
    assay_certificate: Optional[str] = None
    vault_id: int
    owner: Optional[str] = None


class GoldItemCreate(GoldItemBase):
    pass


class GoldItemUpdate(BaseModel):
    vault_id: Optional[int] = None
    status: Optional[str] = None
    owner: Optional[str] = None


class GoldItemResponse(GoldItemBase):
    id: int
    fine_weight_oz: float
    status: str
    created_at: datetime
    vault_name: Optional[str] = None

    model_config = {"from_attributes": True}


class ShipmentBase(BaseModel):
    origin_vault_id: int
    destination_vault_id: int
    carrier: Optional[str] = None
    departure_date: Optional[date] = None
    estimated_arrival: Optional[date] = None
    insurance_value: float = 0.0
    notes: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    gold_item_ids: List[int] = []


class ShipmentStatusUpdate(BaseModel):
    status: str
    actual_arrival: Optional[date] = None


class ShipmentResponse(ShipmentBase):
    id: int
    shipment_ref: str
    status: str
    actual_arrival: Optional[date] = None
    created_at: datetime
    origin_vault_name: Optional[str] = None
    destination_vault_name: Optional[str] = None
    item_count: int = 0
    total_weight_oz: float = 0.0

    model_config = {"from_attributes": True}


class AllocationBase(BaseModel):
    gold_item_id: int
    counterparty_id: int
    allocation_type: str = "ALLOCATED"
    allocated_date: date


class AllocationCreate(AllocationBase):
    pass


class AllocationResponse(AllocationBase):
    id: int
    is_active: bool
    released_date: Optional[date] = None
    created_at: datetime
    gold_item_serial: Optional[str] = None
    counterparty_name: Optional[str] = None

    model_config = {"from_attributes": True}
