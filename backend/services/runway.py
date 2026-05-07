from datetime import datetime, timezone
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



# Dynamic calculation of goals' saved amount allocation
def calculate_auto_goal_allocations(amount_to_add: float, active_goals: List[Dict[str, Any]]) -> Dict[str, float]:

    if amount_to_add <= 0 or not active_goals:
        return {}

    now = datetime.now(timezone.utc)
    goal_allocations = {}
    remaining_amount = amount_to_add

    # Use while to prevent Overflow
    while remaining_amount > 0.01:
        # 1. Check for active goals
        pending_goals = []
        for g in active_goals:
            gid = g.get('goalId')
            # Gap = Target - Saved - Allocated this time
            current_gap = g.get('targetAmount', 0) - g.get('savedAmount', 0) - goal_allocations.get(gid, 0)
            if current_gap > 0.01:
                pending_goals.append((g, current_gap))
        if not pending_goals:
            break

        # 2. Weightage calculation
        weights = {}
        total_weight = 0.0
        
        for g, gap in pending_goals:
            deadline = g.get('deadline')
            # Default as 30 if no deadline mentioned
            if deadline:
                if deadline.tzinfo is None:
                    deadline = deadline.replace(tzinfo=timezone.utc)
                days_left = max((deadline - now).days, 1)
            else:
                days_left = 30
            
            # Formula：Gap / Days remaining to deadline
            weight = gap / days_left 
            weights[g.get('goalId')] = weight
            total_weight += weight

        # Safety: Evenly distributed if zero weightage
        if total_weight <= 0:
            total_weight = len(pending_goals)
            weights = {g.get('goalId'): 1.0 for g, _ in pending_goals}

        # 3. Distribute remaining_amount based on weightage
        amount_distributed_this_round = 0.0
        for g, gap in pending_goals:
            gid = g.get('goalId')
            share = remaining_amount * (weights[gid] / total_weight)
            
            actual_add = min(share, gap)
            
            goal_allocations[gid] = goal_allocations.get(gid, 0.0) + actual_add
            amount_distributed_this_round += actual_add

        remaining_amount -= amount_distributed_this_round

    # Round off
    return {k: round(v, 2) for k, v in goal_allocations.items() if v > 0}