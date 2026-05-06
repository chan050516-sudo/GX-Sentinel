from langchain_core.tools import tool
from firebase.crud import get_user, get_user_goals, get_calendar_upcoming_expenses, get_recent_transactions

@tool
def get_current_runway(user_id: str) -> float:
    """获取用户当前的财务跑道天数（生存天数）"""
    user = get_user(user_id)
    return user.get("currentRunwayDays", 0.0)

@tool
def get_variable_balance(user_id: str) -> float:
    """获取用户当前可变预算余额（可自由支配资金）"""
    user = get_user(user_id)
    return user.get("financialSections", {}).get("variableBudget", 0.0)

@tool
def get_active_goals(user_id: str) -> list:
    """获取用户当前的活跃储蓄目标（未完成的目标）"""
    goals = get_user_goals(user_id)
    return [g for g in goals if g.get("savedAmount", 0) < g.get("targetAmount", 0)]

@tool
def get_similar_purchases_count(user_id: str, product_name: str, days: int = 30) -> int:
    """查询过去指定天数内，用户购买类似商品的次数（用于判断习惯性冲动）"""
    # 调用 crud 中已有的函数
    from ..firebase.crud import get_similar_purchases_count as db_count
    return db_count(user_id, product_name, days)

@tool
def get_upcoming_calendar_expenses(user_id: str) -> list:
    """获取用户未来30天内的日历支出预估（如房租、牙医、聚餐等）。如果有，必须预留资金。"""
    expenses = get_calendar_upcoming_expenses(user_id, days=30)
    return [{"event": e.get("title"), "cost": e.get("estimatedCost"), "date": str(e.get("date"))} 
            for e in expenses]

@tool
def calculate_runway_impact(transaction_amount: float, user_id: str) -> dict:
    """计算一笔交易会对财务跑道产生多大影响，返回减少天数及复利损失示例"""
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