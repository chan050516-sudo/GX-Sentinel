from datetime import datetime
from typing import List, Dict, Any

def calculate_runway_impact(
    current_runway_days: float,
    transaction_amount: float,
    avg_daily_spending: float,
    user_variable_balance: float
) -> Dict[str, Any]:

    if avg_daily_spending <= 0:
        avg_daily_spending = 50.0
    runway_drop = transaction_amount / avg_daily_spending
    new_runway = max(0, current_runway_days - runway_drop)
    
    future_value_loss = transaction_amount * (1.08 ** 5) - transaction_amount
    compound_loss_example = f"If instead invested at 8% for 5 years, you would gain RM {future_value_loss:.2f}."
    
    return {
        "runway_drop_days": round(runway_drop, 1),
        "new_runway_days": round(new_runway, 1),
        "compound_loss_example": compound_loss_example
    }

"""
    Check conflict between transaction and long-term goals
        - has_conflict: bool
        - conflict_message: str
        - affected_goal: dict | None
    """
def check_goal_conflict(
    transaction_amount: float,
    goals: List[Dict[str, Any]],
    current_variable_balance: float
) -> Dict[str, Any]:
    
    if not goals:
        return {"has_conflict": False, "conflict_message": "", "affected_goal": None}
    
    active_goals = [g for g in goals if g.get("savedAmount", 0) < g.get("targetAmount", 0)]
    if not active_goals:
        return {"has_conflict": False, "conflict_message": "", "affected_goal": None}
    
    # priority order
    active_goals.sort(key=lambda x: x.get("priority", 999))
    top_goal = active_goals[0]
    remaining = top_goal["targetAmount"] - top_goal.get("savedAmount", 0)
    
    # 若消费金额超过剩余目标的 20% 或超过可变预算的 50%，则视为冲突
    if transaction_amount > remaining * 0.2 or transaction_amount > current_variable_balance * 0.5:
        conflict_msg = f"⚠️ This purchase would consume RM {transaction_amount:.0f} – that's {transaction_amount/remaining*100:.0f}% of your '{top_goal['title']}' goal (RM {remaining:.0f} left)."
        return {
            "has_conflict": True,
            "conflict_message": conflict_msg,
            "affected_goal": top_goal
        }
    
    return {"has_conflict": False, "conflict_message": "", "affected_goal": None}