from datetime import date
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.models.logistics import Vault, GoldItem, Shipment, ShipmentItem, Allocation
from app.models.trading import Counterparty
from app.schemas.logistics import (
    VaultCreate, VaultUpdate, VaultResponse,
    GoldItemCreate, GoldItemUpdate, GoldItemResponse,
    ShipmentCreate, ShipmentStatusUpdate, ShipmentResponse,
    AllocationCreate, AllocationResponse,
)


# --- Vaults ---

def get_vaults(db: Session) -> List[VaultResponse]:
    vaults = db.query(Vault).order_by(Vault.name).all()
    result = []
    for v in vaults:
        holdings = db.query(func.coalesce(func.sum(GoldItem.fine_weight_oz), 0.0)).filter(
            GoldItem.vault_id == v.id,
            GoldItem.status.in_(["AVAILABLE", "ALLOCATED", "RESERVED"]),
        ).scalar()
        count = db.query(GoldItem).filter(
            GoldItem.vault_id == v.id,
            GoldItem.status.in_(["AVAILABLE", "ALLOCATED", "RESERVED"]),
        ).count()
        result.append(VaultResponse(
            id=v.id, name=v.name, code=v.code, location=v.location,
            operator=v.operator, capacity_oz=v.capacity_oz, is_active=v.is_active,
            created_at=v.created_at, current_holdings_oz=round(holdings, 2), item_count=count,
        ))
    return result


def create_vault(db: Session, data: VaultCreate) -> Vault:
    vault = Vault(**data.model_dump())
    db.add(vault)
    db.commit()
    db.refresh(vault)
    return vault


def update_vault(db: Session, vault_id: int, data: VaultUpdate) -> Optional[Vault]:
    vault = db.query(Vault).filter(Vault.id == vault_id).first()
    if not vault:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(vault, key, val)
    db.commit()
    db.refresh(vault)
    return vault


# --- Gold Items ---

def get_gold_items(
    db: Session,
    vault_id: Optional[int] = None,
    status: Optional[str] = None,
    item_type: Optional[str] = None,
) -> List[GoldItemResponse]:
    query = db.query(GoldItem).options(joinedload(GoldItem.vault))
    if vault_id:
        query = query.filter(GoldItem.vault_id == vault_id)
    if status:
        query = query.filter(GoldItem.status == status)
    if item_type:
        query = query.filter(GoldItem.item_type == item_type)
    items = query.order_by(GoldItem.created_at.desc()).all()
    return [
        GoldItemResponse(
            id=i.id, serial_number=i.serial_number, item_type=i.item_type,
            weight_oz=i.weight_oz, gross_weight_oz=i.gross_weight_oz,
            purity=i.purity, fine_weight_oz=i.fine_weight_oz,
            refiner=i.refiner, assay_certificate=i.assay_certificate,
            vault_id=i.vault_id, owner=i.owner, status=i.status,
            created_at=i.created_at, vault_name=i.vault.name if i.vault else None,
        )
        for i in items
    ]


def get_gold_item(db: Session, item_id: int) -> Optional[GoldItem]:
    return db.query(GoldItem).options(joinedload(GoldItem.vault)).filter(GoldItem.id == item_id).first()


def create_gold_item(db: Session, data: GoldItemCreate) -> GoldItem:
    fine_weight = round(data.gross_weight_oz * data.purity, 4)
    item = GoldItem(fine_weight_oz=fine_weight, status="AVAILABLE", **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_gold_item(db: Session, item_id: int, data: GoldItemUpdate) -> Optional[GoldItem]:
    item = db.query(GoldItem).filter(GoldItem.id == item_id).first()
    if not item:
        return None
    for key, val in data.model_dump(exclude_unset=True).items():
        setattr(item, key, val)
    db.commit()
    db.refresh(item)
    return item


# --- Shipments ---

def _generate_shipment_ref(db: Session) -> str:
    count = db.query(Shipment).count()
    return f"SHP-{count + 1:06d}"


def get_shipments(db: Session, status: Optional[str] = None) -> List[ShipmentResponse]:
    query = db.query(Shipment).options(
        joinedload(Shipment.origin_vault),
        joinedload(Shipment.destination_vault),
        joinedload(Shipment.items).joinedload(ShipmentItem.gold_item),
    )
    if status:
        query = query.filter(Shipment.status == status)
    shipments = query.order_by(Shipment.created_at.desc()).all()
    result = []
    for s in shipments:
        total_weight = sum(si.gold_item.fine_weight_oz for si in s.items if si.gold_item)
        result.append(ShipmentResponse(
            id=s.id, shipment_ref=s.shipment_ref,
            origin_vault_id=s.origin_vault_id, destination_vault_id=s.destination_vault_id,
            carrier=s.carrier, status=s.status,
            departure_date=s.departure_date, estimated_arrival=s.estimated_arrival,
            actual_arrival=s.actual_arrival, insurance_value=s.insurance_value,
            notes=s.notes, created_at=s.created_at,
            origin_vault_name=s.origin_vault.name if s.origin_vault else None,
            destination_vault_name=s.destination_vault.name if s.destination_vault else None,
            item_count=len(s.items), total_weight_oz=round(total_weight, 2),
        ))
    return result


def create_shipment(db: Session, data: ShipmentCreate) -> Shipment:
    ref = _generate_shipment_ref(db)
    shipment = Shipment(
        shipment_ref=ref,
        origin_vault_id=data.origin_vault_id,
        destination_vault_id=data.destination_vault_id,
        carrier=data.carrier,
        status="PLANNED",
        departure_date=data.departure_date,
        estimated_arrival=data.estimated_arrival,
        insurance_value=data.insurance_value,
        notes=data.notes,
    )
    db.add(shipment)
    db.flush()

    for item_id in data.gold_item_ids:
        si = ShipmentItem(shipment_id=shipment.id, gold_item_id=item_id)
        db.add(si)
        item = db.query(GoldItem).filter(GoldItem.id == item_id).first()
        if item:
            item.status = "RESERVED"
    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment_status(db: Session, shipment_id: int, data: ShipmentStatusUpdate) -> Optional[Shipment]:
    shipment = db.query(Shipment).options(
        joinedload(Shipment.items).joinedload(ShipmentItem.gold_item)
    ).filter(Shipment.id == shipment_id).first()
    if not shipment:
        return None

    shipment.status = data.status
    if data.actual_arrival:
        shipment.actual_arrival = data.actual_arrival

    if data.status == "IN_TRANSIT":
        for si in shipment.items:
            if si.gold_item:
                si.gold_item.status = "IN_TRANSIT"
    elif data.status == "DELIVERED":
        for si in shipment.items:
            if si.gold_item:
                si.gold_item.vault_id = shipment.destination_vault_id
                si.gold_item.status = "AVAILABLE"

    db.commit()
    db.refresh(shipment)
    return shipment


# --- Allocations ---

def get_allocations(db: Session, active_only: bool = True) -> List[AllocationResponse]:
    query = db.query(Allocation).options(
        joinedload(Allocation.gold_item),
        joinedload(Allocation.counterparty),
    )
    if active_only:
        query = query.filter(Allocation.is_active == True)
    allocations = query.order_by(Allocation.created_at.desc()).all()
    return [
        AllocationResponse(
            id=a.id, gold_item_id=a.gold_item_id, counterparty_id=a.counterparty_id,
            allocation_type=a.allocation_type, allocated_date=a.allocated_date,
            is_active=a.is_active, released_date=a.released_date,
            created_at=a.created_at,
            gold_item_serial=a.gold_item.serial_number if a.gold_item else None,
            counterparty_name=a.counterparty.name if a.counterparty else None,
        )
        for a in allocations
    ]


def create_allocation(db: Session, data: AllocationCreate) -> Allocation:
    allocation = Allocation(**data.model_dump(), is_active=True)
    db.add(allocation)
    item = db.query(GoldItem).filter(GoldItem.id == data.gold_item_id).first()
    if item:
        item.status = "ALLOCATED"
    db.commit()
    db.refresh(allocation)
    return allocation


def release_allocation(db: Session, allocation_id: int) -> Optional[Allocation]:
    allocation = db.query(Allocation).filter(Allocation.id == allocation_id).first()
    if not allocation:
        return None
    allocation.is_active = False
    allocation.released_date = date.today()
    item = db.query(GoldItem).filter(GoldItem.id == allocation.gold_item_id).first()
    if item:
        item.status = "AVAILABLE"
    db.commit()
    db.refresh(allocation)
    return allocation
