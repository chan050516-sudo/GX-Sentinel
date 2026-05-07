from langchain_core.tools import tool
from firebase.crud import get_user, get_user_goals, get_calendar_upcoming_expenses, get_recent_transactions

@tool
def get_current_runway(user_id: str) -> float:
    """Get the user's current financial runway days (how many days they can survive with current funds)."""
    user = get_user(user_id)
    return user.get("currentRunwayDays", 0.0)

@tool
def get_variable_balance(user_id: str) -> float:
    """Get the user's current variable budget balance (discretionary spending money)."""
    user = get_user(user_id)
    return user.get("financialSections", {}).get("variableBudget", 0.0)

@tool
def get_active_goals(user_id: str) -> list:
    """Get the user's active savings goals that are not yet completed."""
    goals = get_user_goals(user_id)
    return [g for g in goals if g.get("savedAmount", 0) < g.get("targetAmount", 0)]

@tool
def get_similar_purchases_count(user_id: str, product_name: str, days: int = 30) -> int:
    """Count how many similar purchases the user made in the last N days."""
    from firebase.crud import get_similar_purchases_count as db_count
    return db_count(user_id, product_name, days)

@tool
def get_upcoming_calendar_expenses(user_id: str) -> list:
    """Get list of upcoming calendar expenses (events with estimated cost) within the next 30 days."""
    from firebase.crud import get_upcoming_events
    events = get_upcoming_events(user_id, days=30)
    return [{"event": e["title"], "cost": e["estimatedCost"], "date": e["date"].isoformat() if e.get("date") else None} for e in events]

@tool
def calculate_runway_impact(transaction_amount: float, user_id: str) -> dict:
    """Calculate how a transaction will impact the user's financial runway, including days reduced and compound loss example."""
    user = get_user(user_id)
    current_runway = user.get("currentRunwayDays", 30.0)
    avg_daily = user.get("totalOutflow", 2000) / 30.0 if user.get("totalOutflow") else 50.0
    drop = transaction_amount / avg_daily if avg_daily > 0 else 0
    new_runway = max(0, current_runway - drop)
    future_loss = transaction_amount * (1.08 ** 5) - transaction_amount
    return {
        "runway_drop_days": round(drop, 1),
        "new_runway_days": round(new_runway, 1),
        "compound_loss_example": f"If invested at 8% for 5 years, you would gain RM {future_loss:.2f}."
    }