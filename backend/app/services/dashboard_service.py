from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.trading import Position, Trade
from app.models.logistics import GoldItem
from app.models.risk import RiskAlert
from app.schemas.common import DashboardSummary
from app.utils.calculations import calculate_unrealized_pnl


def get_dashboard_summary(db: Session, current_price: float) -> DashboardSummary:
    # Positions
    positions = db.query(Position).all()
    net_position = sum(p.net_quantity_oz for p in positions)
    total_realized = sum(p.realized_pnl for p in positions)
    total_unrealized = sum(
        calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, current_price)
        for p in positions
    )

    # VaR - import here to avoid circular
    from app.services.risk_service import calculate_portfolio_var
    var_result = calculate_portfolio_var(db, current_price)

    # Inventory
    total_inventory = db.query(
        func.coalesce(func.sum(GoldItem.fine_weight_oz), 0.0)
    ).filter(GoldItem.status.in_(["AVAILABLE", "ALLOCATED", "RESERVED"])).scalar()

    # Alerts
    active_alerts = db.query(RiskAlert).filter(RiskAlert.is_acknowledged == False).count()

    # Trades
    total_trades = db.query(Trade).count()

    return DashboardSummary(
        net_position_oz=round(net_position, 4),
        unrealized_pnl=round(total_unrealized, 2),
        realized_pnl=round(total_realized, 2),
        var_95=var_result.var_95,
        total_inventory_oz=round(total_inventory, 4),
        active_alerts=active_alerts,
        total_trades=total_trades,
        current_gold_price=current_price,
    )
