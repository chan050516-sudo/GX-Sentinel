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
    
    # 1. Get unsettled goals
    active_goals = [g for g in goals if g.get("savedAmount", 0) < g.get("targetAmount", 0)]
    if not active_goals:
        return {"has_conflict": False, "conflict_message": "", "affected_goal": None}
    
    # 2. Goal Gradient Effect
    # Descending order based on progress, the nearer the user approaching the target, the more pain he feels when ruined
    active_goals.sort(key=lambda x: (x.get("savedAmount", 0) / max(1, x.get("targetAmount", 1))), reverse=True)
    top_goal = active_goals[0]
    
    target_amount = top_goal.get("targetAmount", 1)
    
    # 3. Calculate progress loss
    progress_loss_percent = (transaction_amount / target_amount) * 100
    
    # Threshold：Consume progress > 2% or consume variable balance > 30%，interrupt
    if progress_loss_percent > 2.0 or transaction_amount > current_variable_balance * 0.3:
        conflict_msg = (
            f"You are sacrificing {progress_loss_percent:.1f}% of your progress towards '{top_goal['title']}'."
        )
        return {
            "has_conflict": True,
            "conflict_message": conflict_msg,
            "affected_goal": top_goal
        }
    
    return {"has_conflict": False, "conflict_message": "", "affected_goal": None}