"""
Small Language Model (SLM) Service - Rule-based AI Assistant for Gold Trading.

This simulates an SLM that provides intelligent responses about gold trading,
risk management, and logistics by analyzing real application data.
"""

import random
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.trading import Position, Trade, Counterparty
from app.models.logistics import GoldItem, Vault, Shipment
from app.models.risk import RiskLimit, RiskAlert, MarginAccount, PriceHistory
from app.utils.calculations import calculate_unrealized_pnl


def _get_portfolio_context(db: Session, current_price: float) -> Dict[str, Any]:
    """Gather portfolio data for context-aware responses."""
    positions = db.query(Position).all()
    net_position = sum(p.net_quantity_oz for p in positions)
    total_unrealized = sum(
        calculate_unrealized_pnl(p.net_quantity_oz, p.avg_cost_per_oz, current_price)
        for p in positions
    )
    total_realized = sum(p.realized_pnl for p in positions)

    trades = db.query(Trade).all()
    active_trades = [t for t in trades if t.status in ("PENDING", "CONFIRMED")]

    alerts = db.query(RiskAlert).filter(RiskAlert.is_acknowledged == False).all()
    limits = db.query(RiskLimit).filter(RiskLimit.is_active == True).all()
    breached_limits = [l for l in limits if abs(l.current_value) >= l.max_value]

    inventory = db.query(func.coalesce(func.sum(GoldItem.fine_weight_oz), 0.0)).filter(
        GoldItem.status.in_(["AVAILABLE", "ALLOCATED", "RESERVED"])
    ).scalar()

    vaults = db.query(Vault).filter(Vault.is_active == True).all()
    shipments = db.query(Shipment).filter(Shipment.status == "IN_TRANSIT").all()

    margins = db.query(MarginAccount).all()
    margin_calls = [m for m in margins if m.required_margin > m.posted_margin]

    return {
        "current_price": current_price,
        "net_position_oz": round(net_position, 4),
        "unrealized_pnl": round(total_unrealized, 2),
        "realized_pnl": round(total_realized, 2),
        "total_trades": len(trades),
        "active_trades": len(active_trades),
        "active_alerts": len(alerts),
        "alert_details": alerts[:5],
        "breached_limits": len(breached_limits),
        "breached_limit_details": breached_limits,
        "total_inventory_oz": round(inventory, 4),
        "vault_count": len(vaults),
        "vaults": vaults,
        "in_transit_shipments": len(shipments),
        "margin_calls": len(margin_calls),
        "positions": positions,
    }


# Intent classification patterns
INTENT_PATTERNS = {
    "portfolio_summary": [
        "portfolio", "summary", "overview", "how am i doing", "position",
        "holdings", "what do i have", "my book", "pnl", "p&l", "profit", "loss",
    ],
    "risk_analysis": [
        "risk", "var", "value at risk", "exposure", "hedge", "hedging",
        "stress test", "scenario", "volatility", "drawdown",
    ],
    "price_analysis": [
        "price", "gold price", "xau", "market", "trend", "forecast",
        "prediction", "where is gold", "current price", "spot",
    ],
    "trade_advice": [
        "should i buy", "should i sell", "trade", "recommendation",
        "what should i do", "opportunity", "strategy", "action",
    ],
    "alerts_status": [
        "alert", "warning", "breach", "limit", "margin call",
        "notification", "issue", "problem", "concern",
    ],
    "logistics_status": [
        "vault", "inventory", "shipment", "delivery", "storage",
        "physical", "bar", "coin", "transit", "warehouse",
    ],
    "greeting": [
        "hello", "hi", "hey", "good morning", "good afternoon",
        "good evening", "help", "what can you do",
    ],
}


def _classify_intent(message: str) -> str:
    """Classify user message intent using keyword matching."""
    message_lower = message.lower().strip()

    scores = {}
    for intent, keywords in INTENT_PATTERNS.items():
        score = sum(1 for kw in keywords if kw in message_lower)
        if score > 0:
            scores[intent] = score

    if not scores:
        return "general"

    return max(scores, key=scores.get)


def _format_currency(value: float) -> str:
    """Format a number as currency."""
    if abs(value) >= 1_000_000:
        return f"${value / 1_000_000:,.2f}M"
    elif abs(value) >= 1_000:
        return f"${value:,.2f}"
    return f"${value:.2f}"


def _generate_response(intent: str, ctx: Dict[str, Any], message: str) -> str:
    """Generate a contextual response based on intent and portfolio data."""

    if intent == "greeting":
        return (
            f"Hello! I'm your AI Gold Trading Assistant. I can help you with:\n\n"
            f"• **Portfolio Analysis** — positions, P&L, and performance\n"
            f"• **Risk Assessment** — VaR, exposure, limits, and alerts\n"
            f"• **Market Insights** — current gold price and trends\n"
            f"• **Trade Recommendations** — based on your current book\n"
            f"• **Logistics Status** — vaults, inventory, and shipments\n\n"
            f"Gold is currently trading at {_format_currency(ctx['current_price'])} per oz. "
            f"What would you like to know?"
        )

    if intent == "portfolio_summary":
        pnl_status = "profit" if ctx["unrealized_pnl"] >= 0 else "loss"
        direction = "long" if ctx["net_position_oz"] > 0 else "short" if ctx["net_position_oz"] < 0 else "flat"
        total_value = abs(ctx["net_position_oz"] * ctx["current_price"])

        response = (
            f"**Portfolio Summary**\n\n"
            f"Your book is currently **{direction}** with a net position of "
            f"**{abs(ctx['net_position_oz']):,.4f} oz** "
            f"(valued at {_format_currency(total_value)}).\n\n"
            f"• **Unrealized P&L**: {_format_currency(ctx['unrealized_pnl'])} ({pnl_status})\n"
            f"• **Realized P&L**: {_format_currency(ctx['realized_pnl'])}\n"
            f"• **Total P&L**: {_format_currency(ctx['unrealized_pnl'] + ctx['realized_pnl'])}\n"
            f"• **Active Trades**: {ctx['active_trades']} of {ctx['total_trades']} total\n"
            f"• **Current Gold Price**: {_format_currency(ctx['current_price'])}/oz\n"
        )

        if ctx["active_alerts"] > 0:
            response += f"\n⚠ You have **{ctx['active_alerts']} active alert(s)** requiring attention."

        return response

    if intent == "risk_analysis":
        response = (
            f"**Risk Assessment**\n\n"
            f"Based on your current portfolio:\n\n"
            f"• **Net Exposure**: {_format_currency(abs(ctx['net_position_oz'] * ctx['current_price']))}\n"
            f"• **Position Size**: {abs(ctx['net_position_oz']):,.4f} oz\n"
            f"• **Active Alerts**: {ctx['active_alerts']}\n"
            f"• **Breached Limits**: {ctx['breached_limits']}\n"
            f"• **Margin Calls**: {ctx['margin_calls']}\n"
        )

        if ctx["breached_limits"] > 0:
            response += f"\n🔴 **WARNING**: {ctx['breached_limits']} risk limit(s) are currently breached. "
            response += "Immediate review recommended.\n"
            for lim in ctx["breached_limit_details"][:3]:
                util = (abs(lim.current_value) / lim.max_value * 100) if lim.max_value > 0 else 0
                response += f"  — {lim.limit_name}: {util:.0f}% utilized\n"

        if ctx["margin_calls"] > 0:
            response += f"\n🟡 **{ctx['margin_calls']} margin call(s)** outstanding. Ensure collateral is posted.\n"

        if ctx["breached_limits"] == 0 and ctx["margin_calls"] == 0 and ctx["active_alerts"] == 0:
            response += "\n✅ All risk metrics are within acceptable bounds. No immediate action required."

        return response

    if intent == "price_analysis":
        price = ctx["current_price"]
        response = (
            f"**Gold Market Analysis**\n\n"
            f"• **Current Spot Price**: {_format_currency(price)}/oz\n"
            f"• **Price Source**: Mock data (POC mode)\n\n"
        )

        # Simulated analysis based on price level
        if price > 2700:
            response += (
                "Gold is trading at elevated levels. Key observations:\n"
                "- Price is above the $2,700 resistance level\n"
                "- Consider partial profit-taking on long positions\n"
                "- Monitor for potential pullback to $2,650 support\n"
            )
        elif price > 2600:
            response += (
                "Gold is trading in a consolidation range. Key observations:\n"
                "- Price is between $2,600-$2,700 range\n"
                "- Support at $2,600, resistance at $2,700\n"
                "- Neutral bias — wait for breakout direction\n"
            )
        else:
            response += (
                "Gold is trading at lower levels. Key observations:\n"
                "- Price is below $2,600 support\n"
                "- Potential buying opportunity on dips\n"
                "- Watch for reversal signals near key support\n"
            )

        response += (
            "\n*Note: This is a POC demonstration using mock prices. "
            "In production, this would integrate with real market data feeds.*"
        )
        return response

    if intent == "trade_advice":
        direction = "long" if ctx["net_position_oz"] > 0 else "short" if ctx["net_position_oz"] < 0 else "flat"

        response = f"**Trade Analysis & Suggestions**\n\n"
        response += f"Current position: **{direction}** {abs(ctx['net_position_oz']):,.4f} oz\n\n"

        if direction == "long":
            if ctx["unrealized_pnl"] > 0:
                response += (
                    "Your long position is in profit. Consider:\n"
                    "1. **Partial take-profit** — Scale out 25-50% to lock in gains\n"
                    "2. **Trailing stop** — Set a stop below recent support to protect profits\n"
                    "3. **Hold** — If you have a bullish long-term view, maintain the position\n"
                )
            else:
                response += (
                    "Your long position is underwater. Consider:\n"
                    "1. **Average down** — Add to position if conviction is high (increases risk)\n"
                    "2. **Cut losses** — Reduce position if the loss exceeds your risk tolerance\n"
                    "3. **Hedge** — Consider a short forward to limit further downside\n"
                )
        elif direction == "short":
            if ctx["unrealized_pnl"] > 0:
                response += (
                    "Your short position is in profit. Consider:\n"
                    "1. **Cover partially** — Take profit on 25-50% of the short\n"
                    "2. **Set a buy-stop** — Protect against a squeeze above resistance\n"
                )
            else:
                response += (
                    "Your short position is at a loss. Consider:\n"
                    "1. **Cover** — Close the short if gold momentum is bullish\n"
                    "2. **Hold** — If you expect a reversal, maintain with tight stop\n"
                )
        else:
            response += (
                "You have no net position. Consider:\n"
                f"1. **Buy** — If bullish on gold above {_format_currency(ctx['current_price'])}\n"
                f"2. **Sell** — If bearish, initiate a short position\n"
                "3. **Wait** — Monitor for a clear directional signal\n"
            )

        if ctx["breached_limits"] > 0:
            response += f"\n⚠ Note: {ctx['breached_limits']} risk limit(s) breached — new trades may be restricted."

        response += "\n\n*Disclaimer: This is a POC AI assistant. Not financial advice.*"
        return response

    if intent == "alerts_status":
        response = f"**Alerts & Notifications**\n\n"

        if ctx["active_alerts"] == 0:
            response += "✅ No active alerts. All systems are within normal parameters.\n"
        else:
            response += f"🔔 You have **{ctx['active_alerts']} active alert(s)**:\n\n"
            for alert in ctx["alert_details"]:
                severity_icon = {"LOW": "🟢", "MEDIUM": "🟡", "HIGH": "🟠", "CRITICAL": "🔴"}.get(alert.severity, "⚪")
                response += f"{severity_icon} **[{alert.severity}]** {alert.message}\n"

        if ctx["breached_limits"] > 0:
            response += f"\n**Breached Limits**: {ctx['breached_limits']}\n"
            for lim in ctx["breached_limit_details"]:
                response += f"  — {lim.limit_name}: Current {_format_currency(abs(lim.current_value))} vs Max {_format_currency(lim.max_value)}\n"

        if ctx["margin_calls"] > 0:
            response += f"\n**Margin Calls**: {ctx['margin_calls']} counterpart(ies) require margin top-up.\n"

        return response

    if intent == "logistics_status":
        response = (
            f"**Logistics & Inventory Status**\n\n"
            f"• **Total Physical Gold**: {ctx['total_inventory_oz']:,.4f} oz in custody\n"
            f"• **Active Vaults**: {ctx['vault_count']}\n"
            f"• **Shipments In-Transit**: {ctx['in_transit_shipments']}\n\n"
        )

        if ctx["vaults"]:
            response += "**Vault Locations**:\n"
            for v in ctx["vaults"][:5]:
                response += f"  — {v.name} ({v.location}): Capacity {v.capacity_oz:,.0f} oz\n"

        if ctx["in_transit_shipments"] > 0:
            response += f"\n📦 {ctx['in_transit_shipments']} shipment(s) currently in transit. Check the Shipments page for details."
        else:
            response += "\n✅ No shipments currently in transit."

        return response

    # General / fallback
    return (
        f"I understand you're asking about: *\"{message}\"*\n\n"
        f"Here's a quick snapshot of your gold trading desk:\n\n"
        f"• **Gold Price**: {_format_currency(ctx['current_price'])}/oz\n"
        f"• **Net Position**: {ctx['net_position_oz']:,.4f} oz\n"
        f"• **P&L**: {_format_currency(ctx['unrealized_pnl'] + ctx['realized_pnl'])}\n"
        f"• **Active Alerts**: {ctx['active_alerts']}\n"
        f"• **Inventory**: {ctx['total_inventory_oz']:,.4f} oz\n\n"
        f"Try asking me about:\n"
        f"- \"How is my portfolio doing?\"\n"
        f"- \"What are the current risks?\"\n"
        f"- \"Show me alert status\"\n"
        f"- \"Any trade recommendations?\"\n"
        f"- \"What's the gold price outlook?\"\n"
        f"- \"Logistics status\""
    )


# Predefined quick suggestions per intent
FOLLOW_UP_SUGGESTIONS = {
    "greeting": ["How is my portfolio?", "Any active alerts?", "Gold price analysis", "Trade recommendations"],
    "portfolio_summary": ["Risk assessment", "Trade recommendations", "Alert status", "Logistics status"],
    "risk_analysis": ["Show alerts", "Portfolio summary", "Trade advice", "Stress test info"],
    "price_analysis": ["Should I buy or sell?", "Portfolio summary", "Risk assessment", "Current positions"],
    "trade_advice": ["Risk analysis", "Portfolio overview", "Alert status", "Price analysis"],
    "alerts_status": ["Risk assessment", "Portfolio summary", "Trade advice", "Logistics status"],
    "logistics_status": ["Portfolio summary", "Alert status", "Risk assessment", "Gold price"],
    "general": ["Portfolio summary", "Risk analysis", "Alert status", "Trade advice"],
}


def process_chat_message(
    db: Session,
    message: str,
    current_price: float,
    conversation_history: Optional[List[Dict]] = None,
) -> Dict[str, Any]:
    """
    Process a user chat message and return an AI-generated response.

    This simulates an SLM by:
    1. Classifying the user's intent
    2. Gathering relevant portfolio context
    3. Generating a data-driven natural language response
    """
    intent = _classify_intent(message)
    ctx = _get_portfolio_context(db, current_price)
    response_text = _generate_response(intent, ctx, message)
    suggestions = FOLLOW_UP_SUGGESTIONS.get(intent, FOLLOW_UP_SUGGESTIONS["general"])

    return {
        "response": response_text,
        "intent": intent,
        "confidence": round(random.uniform(0.82, 0.97), 2),
        "model": "GoldSLM-v1 (Rule-based POC)",
        "suggestions": suggestions,
        "timestamp": datetime.utcnow().isoformat(),
        "context_used": {
            "current_price": ctx["current_price"],
            "net_position_oz": ctx["net_position_oz"],
            "active_alerts": ctx["active_alerts"],
        },
    }
