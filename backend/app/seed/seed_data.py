import random
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session

from app.models.trading import Counterparty, Trade, Position
from app.models.logistics import Vault, GoldItem, Shipment, ShipmentItem, Allocation
from app.models.risk import PriceHistory, RiskLimit, MarginAccount, RiskAlert, StressScenario


def seed_all(db: Session):
    _seed_price_history(db)
    counterparties = _seed_counterparties(db)
    vaults = _seed_vaults(db)
    gold_items = _seed_gold_items(db, vaults)
    _seed_trades(db, counterparties)
    _seed_allocations(db, gold_items, counterparties)
    _seed_shipments(db, vaults, gold_items)
    _seed_risk_limits(db)
    _seed_margin_accounts(db, counterparties)
    _seed_stress_scenarios(db)
    _seed_alerts(db)
    db.commit()


def _seed_price_history(db: Session):
    base_price = 2600.0
    now = datetime.utcnow()
    for i in range(252, 0, -1):
        change = random.uniform(-20, 20)
        base_price += change
        base_price = max(base_price, 2200)
        base_price = min(base_price, 3000)
        entry = PriceHistory(
            metal="XAU",
            price_usd=round(base_price, 2),
            currency="USD",
            timestamp=now - timedelta(days=i),
        )
        db.add(entry)
    db.flush()


def _seed_counterparties(db: Session):
    data = [
        {"name": "HSBC Precious Metals", "code": "HSBC-PM", "type": "BANK", "credit_rating": "AA", "credit_limit": 50000000},
        {"name": "JP Morgan Commodities", "code": "JPM-CMD", "type": "BANK", "credit_rating": "AA-", "credit_limit": 75000000},
        {"name": "PAMP SA", "code": "PAMP", "type": "REFINER", "credit_rating": "A+", "credit_limit": 25000000},
        {"name": "Valcambi Suisse", "code": "VALCAMBI", "type": "REFINER", "credit_rating": "A", "credit_limit": 20000000},
        {"name": "Royal Gold Corp", "code": "RGC", "type": "CLIENT", "credit_rating": "BBB+", "credit_limit": 10000000},
    ]
    counterparties = []
    for d in data:
        cp = Counterparty(**d)
        db.add(cp)
        counterparties.append(cp)
    db.flush()
    return counterparties


def _seed_vaults(db: Session):
    data = [
        {"name": "London LBMA Vault", "code": "LDN-01", "location": "London, United Kingdom", "operator": "Brink's", "capacity_oz": 500000},
        {"name": "Zurich Free Port", "code": "ZRH-01", "location": "Zurich, Switzerland", "operator": "Loomis International", "capacity_oz": 300000},
        {"name": "Singapore FTZ Vault", "code": "SGP-01", "location": "Singapore", "operator": "Malca-Amit", "capacity_oz": 200000},
    ]
    vaults = []
    for d in data:
        v = Vault(**d)
        db.add(v)
        vaults.append(v)
    db.flush()
    return vaults


def _seed_gold_items(db: Session, vaults):
    bars = [
        {"serial_number": "PAMP-2024-001234", "item_type": "BAR", "weight_oz": 400, "gross_weight_oz": 400, "purity": 0.9999, "refiner": "PAMP SA", "assay_certificate": "PAMP-AC-001234", "owner": "Bank Treasury"},
        {"serial_number": "PAMP-2024-001235", "item_type": "BAR", "weight_oz": 400, "gross_weight_oz": 400, "purity": 0.9999, "refiner": "PAMP SA", "assay_certificate": "PAMP-AC-001235", "owner": "Bank Treasury"},
        {"serial_number": "VALC-2024-005678", "item_type": "BAR", "weight_oz": 400, "gross_weight_oz": 400, "purity": 0.9995, "refiner": "Valcambi", "assay_certificate": "VALC-AC-005678", "owner": "Bank Treasury"},
        {"serial_number": "VALC-2024-005679", "item_type": "BAR", "weight_oz": 100, "gross_weight_oz": 100, "purity": 0.9999, "refiner": "Valcambi", "assay_certificate": "VALC-AC-005679", "owner": "Client Account"},
        {"serial_number": "HERAEUS-2024-0891", "item_type": "BAR", "weight_oz": 400, "gross_weight_oz": 400, "purity": 0.9999, "refiner": "Heraeus", "assay_certificate": "HER-AC-0891", "owner": "Bank Treasury"},
        {"serial_number": "HERAEUS-2024-0892", "item_type": "BAR", "weight_oz": 100, "gross_weight_oz": 100, "purity": 0.9995, "refiner": "Heraeus", "assay_certificate": "HER-AC-0892", "owner": "Bank Treasury"},
        {"serial_number": "COIN-AGE-2024-001", "item_type": "COIN", "weight_oz": 1, "gross_weight_oz": 1, "purity": 0.9167, "refiner": "Royal Mint", "assay_certificate": "RM-2024-001", "owner": "Client Account"},
        {"serial_number": "COIN-MAP-2024-002", "item_type": "COIN", "weight_oz": 1, "gross_weight_oz": 1, "purity": 0.9999, "refiner": "Royal Canadian Mint", "assay_certificate": "RCM-2024-002", "owner": "Client Account"},
        {"serial_number": "PAMP-2024-001236", "item_type": "BAR", "weight_oz": 400, "gross_weight_oz": 400, "purity": 0.9999, "refiner": "PAMP SA", "assay_certificate": "PAMP-AC-001236", "owner": "Bank Treasury"},
        {"serial_number": "RAND-2024-007890", "item_type": "BAR", "weight_oz": 400, "gross_weight_oz": 400, "purity": 0.9999, "refiner": "Rand Refinery", "assay_certificate": "RAND-AC-007890", "owner": "Bank Treasury"},
    ]
    items = []
    for i, b in enumerate(bars):
        vault = vaults[i % len(vaults)]
        b["vault_id"] = vault.id
        b["fine_weight_oz"] = round(b["gross_weight_oz"] * b["purity"], 4)
        b["status"] = "AVAILABLE"
        item = GoldItem(**b)
        db.add(item)
        items.append(item)
    db.flush()
    return items


def _seed_trades(db: Session, counterparties):
    today = date.today()
    trades_data = [
        {"trade_type": "BUY", "product_type": "SPOT", "quantity_oz": 100, "price_per_oz": 2620.50, "days_ago": 20, "status": "SETTLED"},
        {"trade_type": "BUY", "product_type": "SPOT", "quantity_oz": 200, "price_per_oz": 2635.00, "days_ago": 18, "status": "SETTLED"},
        {"trade_type": "SELL", "product_type": "SPOT", "quantity_oz": 50, "price_per_oz": 2645.00, "days_ago": 15, "status": "SETTLED"},
        {"trade_type": "BUY", "product_type": "FORWARD", "quantity_oz": 500, "price_per_oz": 2660.00, "days_ago": 12, "status": "CONFIRMED"},
        {"trade_type": "SELL", "product_type": "SPOT", "quantity_oz": 100, "price_per_oz": 2655.00, "days_ago": 10, "status": "SETTLED"},
        {"trade_type": "BUY", "product_type": "SPOT", "quantity_oz": 150, "price_per_oz": 2640.00, "days_ago": 8, "status": "CONFIRMED"},
        {"trade_type": "SELL", "product_type": "FORWARD", "quantity_oz": 200, "price_per_oz": 2670.00, "days_ago": 6, "status": "CONFIRMED"},
        {"trade_type": "BUY", "product_type": "SPOT", "quantity_oz": 75, "price_per_oz": 2648.00, "days_ago": 4, "status": "CONFIRMED"},
        {"trade_type": "SELL", "product_type": "SPOT", "quantity_oz": 50, "price_per_oz": 2652.00, "days_ago": 3, "status": "PENDING"},
        {"trade_type": "BUY", "product_type": "SPOT", "quantity_oz": 300, "price_per_oz": 2645.50, "days_ago": 2, "status": "PENDING"},
        {"trade_type": "SELL", "product_type": "FORWARD", "quantity_oz": 100, "price_per_oz": 2680.00, "days_ago": 1, "status": "PENDING"},
        {"trade_type": "BUY", "product_type": "SPOT", "quantity_oz": 50, "price_per_oz": 2650.00, "days_ago": 0, "status": "PENDING"},
    ]

    for i, td in enumerate(trades_data):
        trade_date = today - timedelta(days=td["days_ago"])
        settlement_date = trade_date + timedelta(days=2)
        cp = counterparties[i % len(counterparties)]
        trade = Trade(
            trade_ref=f"TRD-{trade_date.strftime('%Y%m%d')}-{i+1:04d}",
            trade_type=td["trade_type"],
            product_type=td["product_type"],
            counterparty_id=cp.id,
            quantity_oz=td["quantity_oz"],
            price_per_oz=td["price_per_oz"],
            total_value=round(td["quantity_oz"] * td["price_per_oz"], 2),
            currency="USD",
            trade_date=trade_date,
            settlement_date=settlement_date,
            status=td["status"],
        )
        db.add(trade)
    db.flush()

    # Create position summary
    position = Position(
        account="TRADING",
        net_quantity_oz=475.0,  # net of all buys/sells
        avg_cost_per_oz=2641.50,
        realized_pnl=3875.00,
    )
    db.add(position)
    db.flush()


def _seed_allocations(db: Session, gold_items, counterparties):
    if len(gold_items) >= 2 and len(counterparties) >= 2:
        alloc = Allocation(
            gold_item_id=gold_items[3].id,  # 100oz bar
            counterparty_id=counterparties[4].id,  # Royal Gold Corp
            allocation_type="ALLOCATED",
            allocated_date=date.today() - timedelta(days=10),
            is_active=True,
        )
        db.add(alloc)
        gold_items[3].status = "ALLOCATED"
        db.flush()


def _seed_shipments(db: Session, vaults, gold_items):
    if len(vaults) >= 2 and len(gold_items) >= 6:
        shipment = Shipment(
            shipment_ref="SHP-000001",
            origin_vault_id=vaults[0].id,
            destination_vault_id=vaults[1].id,
            carrier="Brink's Global Services",
            status="IN_TRANSIT",
            departure_date=date.today() - timedelta(days=2),
            estimated_arrival=date.today() + timedelta(days=1),
            insurance_value=1200000,
        )
        db.add(shipment)
        db.flush()

        si = ShipmentItem(shipment_id=shipment.id, gold_item_id=gold_items[5].id)
        db.add(si)
        gold_items[5].status = "IN_TRANSIT"
        db.flush()


def _seed_risk_limits(db: Session):
    limits = [
        {"limit_type": "POSITION", "limit_name": "Max Net Position", "max_value": 1000, "current_value": 475, "currency": "OZ"},
        {"limit_type": "VAR", "limit_name": "Daily VaR Limit (95%)", "max_value": 500000, "current_value": 125000, "currency": "USD"},
        {"limit_type": "COUNTERPARTY", "limit_name": "Single Counterparty Exposure", "max_value": 25000000, "current_value": 12500000, "currency": "USD"},
        {"limit_type": "CONCENTRATION", "limit_name": "Vault Concentration Limit", "max_value": 60, "current_value": 45, "currency": "PCT"},
        {"limit_type": "POSITION", "limit_name": "Gross Position Limit", "max_value": 2000, "current_value": 875, "currency": "OZ"},
    ]
    for lim in limits:
        db.add(RiskLimit(**lim))
    db.flush()


def _seed_margin_accounts(db: Session, counterparties):
    for cp in counterparties[:3]:
        margin = MarginAccount(
            counterparty_id=cp.id,
            required_margin=random.uniform(500000, 2000000),
            posted_margin=random.uniform(600000, 2500000),
        )
        margin.margin_call_amount = max(0, margin.required_margin - margin.posted_margin)
        db.add(margin)
    db.flush()


def _seed_stress_scenarios(db: Session):
    scenarios = [
        {"name": "Gold -10% Crash", "price_shock_pct": -0.10, "description": "Simulate a 10% drop in gold prices"},
        {"name": "Gold -20% Severe", "price_shock_pct": -0.20, "description": "Simulate a severe 20% gold price decline"},
        {"name": "Gold +15% Rally", "price_shock_pct": 0.15, "description": "Simulate a 15% gold price rally"},
        {"name": "2008 Crisis (-30%)", "price_shock_pct": -0.30, "description": "Simulate 2008-level financial crisis impact"},
    ]
    for s in scenarios:
        db.add(StressScenario(**s))
    db.flush()


def _seed_alerts(db: Session):
    alerts = [
        {"alert_type": "LIMIT_BREACH", "severity": "MEDIUM", "message": "Position approaching 50% of max limit (475/1000 oz)"},
        {"alert_type": "PRICE_MOVE", "severity": "LOW", "message": "Gold price moved +1.2% in last 24 hours"},
        {"alert_type": "VAR_EXCEEDED", "severity": "HIGH", "message": "Daily VaR exceeded warning threshold at 25% utilization"},
    ]
    for a in alerts:
        db.add(RiskAlert(**a))
    db.flush()
