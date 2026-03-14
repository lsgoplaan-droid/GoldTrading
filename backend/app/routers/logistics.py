from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.logistics import (
    VaultCreate, VaultUpdate, VaultResponse,
    GoldItemCreate, GoldItemUpdate, GoldItemResponse,
    ShipmentCreate, ShipmentStatusUpdate, ShipmentResponse,
    AllocationCreate, AllocationResponse,
)
from app.services import logistics_service

router = APIRouter(prefix="/logistics", tags=["Logistics"])


# --- Vaults ---

@router.get("/vaults", response_model=List[VaultResponse])
def list_vaults(db: Session = Depends(get_db)):
    return logistics_service.get_vaults(db)


@router.post("/vaults", response_model=VaultResponse, status_code=201)
def create_vault(data: VaultCreate, db: Session = Depends(get_db)):
    vault = logistics_service.create_vault(db, data)
    # Return as VaultResponse with defaults
    return VaultResponse(
        id=vault.id, name=vault.name, code=vault.code, location=vault.location,
        operator=vault.operator, capacity_oz=vault.capacity_oz, is_active=vault.is_active,
        created_at=vault.created_at, current_holdings_oz=0.0, item_count=0,
    )


@router.put("/vaults/{vault_id}", response_model=VaultResponse)
def update_vault(vault_id: int, data: VaultUpdate, db: Session = Depends(get_db)):
    result = logistics_service.update_vault(db, vault_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Vault not found")
    return VaultResponse(
        id=result.id, name=result.name, code=result.code, location=result.location,
        operator=result.operator, capacity_oz=result.capacity_oz, is_active=result.is_active,
        created_at=result.created_at, current_holdings_oz=0.0, item_count=0,
    )


# --- Gold Items ---

@router.get("/inventory", response_model=List[GoldItemResponse])
def list_inventory(
    vault_id: Optional[int] = None,
    status: Optional[str] = None,
    item_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return logistics_service.get_gold_items(db, vault_id, status, item_type)


@router.get("/inventory/{item_id}", response_model=GoldItemResponse)
def get_inventory_item(item_id: int, db: Session = Depends(get_db)):
    item = logistics_service.get_gold_item(db, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Gold item not found")
    return GoldItemResponse(
        id=item.id, serial_number=item.serial_number, item_type=item.item_type,
        weight_oz=item.weight_oz, gross_weight_oz=item.gross_weight_oz,
        purity=item.purity, fine_weight_oz=item.fine_weight_oz,
        refiner=item.refiner, assay_certificate=item.assay_certificate,
        vault_id=item.vault_id, owner=item.owner, status=item.status,
        created_at=item.created_at, vault_name=item.vault.name if item.vault else None,
    )


@router.post("/inventory", response_model=GoldItemResponse, status_code=201)
def create_inventory_item(data: GoldItemCreate, db: Session = Depends(get_db)):
    item = logistics_service.create_gold_item(db, data)
    return GoldItemResponse(
        id=item.id, serial_number=item.serial_number, item_type=item.item_type,
        weight_oz=item.weight_oz, gross_weight_oz=item.gross_weight_oz,
        purity=item.purity, fine_weight_oz=item.fine_weight_oz,
        refiner=item.refiner, assay_certificate=item.assay_certificate,
        vault_id=item.vault_id, owner=item.owner, status=item.status,
        created_at=item.created_at,
    )


@router.put("/inventory/{item_id}", response_model=GoldItemResponse)
def update_inventory_item(item_id: int, data: GoldItemUpdate, db: Session = Depends(get_db)):
    result = logistics_service.update_gold_item(db, item_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Gold item not found")
    return GoldItemResponse(
        id=result.id, serial_number=result.serial_number, item_type=result.item_type,
        weight_oz=result.weight_oz, gross_weight_oz=result.gross_weight_oz,
        purity=result.purity, fine_weight_oz=result.fine_weight_oz,
        refiner=result.refiner, assay_certificate=result.assay_certificate,
        vault_id=result.vault_id, owner=result.owner, status=result.status,
        created_at=result.created_at,
    )


# --- Shipments ---

@router.get("/shipments", response_model=List[ShipmentResponse])
def list_shipments(status: Optional[str] = None, db: Session = Depends(get_db)):
    return logistics_service.get_shipments(db, status)


@router.post("/shipments", response_model=ShipmentResponse, status_code=201)
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db)):
    shipment = logistics_service.create_shipment(db, data)
    return ShipmentResponse(
        id=shipment.id, shipment_ref=shipment.shipment_ref,
        origin_vault_id=shipment.origin_vault_id, destination_vault_id=shipment.destination_vault_id,
        carrier=shipment.carrier, status=shipment.status,
        departure_date=shipment.departure_date, estimated_arrival=shipment.estimated_arrival,
        actual_arrival=shipment.actual_arrival, insurance_value=shipment.insurance_value,
        notes=shipment.notes, created_at=shipment.created_at,
        item_count=0, total_weight_oz=0.0,
    )


@router.patch("/shipments/{shipment_id}/status", response_model=ShipmentResponse)
def update_shipment_status(shipment_id: int, data: ShipmentStatusUpdate, db: Session = Depends(get_db)):
    result = logistics_service.update_shipment_status(db, shipment_id, data)
    if not result:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return ShipmentResponse(
        id=result.id, shipment_ref=result.shipment_ref,
        origin_vault_id=result.origin_vault_id, destination_vault_id=result.destination_vault_id,
        carrier=result.carrier, status=result.status,
        departure_date=result.departure_date, estimated_arrival=result.estimated_arrival,
        actual_arrival=result.actual_arrival, insurance_value=result.insurance_value,
        notes=result.notes, created_at=result.created_at,
        item_count=0, total_weight_oz=0.0,
    )


# --- Allocations ---

@router.get("/allocations", response_model=List[AllocationResponse])
def list_allocations(active_only: bool = True, db: Session = Depends(get_db)):
    return logistics_service.get_allocations(db, active_only)


@router.post("/allocations", response_model=AllocationResponse, status_code=201)
def create_allocation(data: AllocationCreate, db: Session = Depends(get_db)):
    allocation = logistics_service.create_allocation(db, data)
    return AllocationResponse(
        id=allocation.id, gold_item_id=allocation.gold_item_id,
        counterparty_id=allocation.counterparty_id,
        allocation_type=allocation.allocation_type,
        allocated_date=allocation.allocated_date,
        is_active=allocation.is_active, released_date=allocation.released_date,
        created_at=allocation.created_at,
    )


@router.delete("/allocations/{allocation_id}")
def release_allocation(allocation_id: int, db: Session = Depends(get_db)):
    result = logistics_service.release_allocation(db, allocation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Allocation not found")
    return {"message": "Allocation released"}
