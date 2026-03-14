from enum import Enum


class TradeType(str, Enum):
    BUY = "BUY"
    SELL = "SELL"


class ProductType(str, Enum):
    SPOT = "SPOT"
    FORWARD = "FORWARD"


class TradeStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    SETTLED = "SETTLED"
    CANCELLED = "CANCELLED"


class CounterpartyType(str, Enum):
    BANK = "BANK"
    DEALER = "DEALER"
    REFINER = "REFINER"
    CLIENT = "CLIENT"


class GoldItemType(str, Enum):
    BAR = "BAR"
    COIN = "COIN"
    GRAIN = "GRAIN"


class GoldItemStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    ALLOCATED = "ALLOCATED"
    IN_TRANSIT = "IN_TRANSIT"
    RESERVED = "RESERVED"


class ShipmentStatus(str, Enum):
    PLANNED = "PLANNED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class AllocationType(str, Enum):
    ALLOCATED = "ALLOCATED"
    UNALLOCATED = "UNALLOCATED"


class RiskLimitType(str, Enum):
    POSITION = "POSITION"
    VAR = "VAR"
    COUNTERPARTY = "COUNTERPARTY"
    CONCENTRATION = "CONCENTRATION"


class AlertType(str, Enum):
    LIMIT_BREACH = "LIMIT_BREACH"
    MARGIN_CALL = "MARGIN_CALL"
    VAR_EXCEEDED = "VAR_EXCEEDED"
    PRICE_MOVE = "PRICE_MOVE"


class AlertSeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
