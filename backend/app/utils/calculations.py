import numpy as np
from typing import List


def calculate_var(returns: List[float], confidence: float = 0.95, position_value: float = 1.0) -> float:
    """Calculate Value at Risk using historical simulation."""
    if not returns or len(returns) < 5:
        return 0.0
    arr = np.array(returns)
    percentile = (1 - confidence) * 100
    var = -np.percentile(arr, percentile) * position_value
    return round(var, 2)


def calculate_log_returns(prices: List[float]) -> List[float]:
    """Calculate log returns from a price series."""
    if len(prices) < 2:
        return []
    arr = np.array(prices)
    returns = np.diff(np.log(arr))
    return returns.tolist()


def calculate_unrealized_pnl(net_qty: float, avg_cost: float, current_price: float) -> float:
    """Calculate unrealized P&L."""
    return round((current_price - avg_cost) * net_qty, 2)


def troy_oz_to_grams(oz: float) -> float:
    return round(oz * 31.1035, 4)


def grams_to_troy_oz(grams: float) -> float:
    return round(grams / 31.1035, 4)
