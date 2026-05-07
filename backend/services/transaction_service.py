import uuid
from ..model.models import ManualTransactionResponse, UserDashboardResponse, FinancialSections
from ..firebase.crud import get_user, update_user

def process_manual_transaction(user_id: str, amount: float) -> ManualTransactionResponse:
    """
    处理消费扣款与微干预 (Micro-Nudge) 惩罚逻辑
    """
    # 1. 读取数据库数据
    user_data = get_user(user_id) or {}
    current_balances = user_data.get("financialSections", {})
    current_runway = user_data.get("currentRunwayDays", 45.2)
    current_score = user_data.get("resilienceScore", 68.5)

    # 2. 扣除预算
    old_balance = current_balances.get("variableBudget", 0.0)
    new_balance = max(0.0, old_balance - amount)

    # 3. 惩罚机制计算 (制造痛感)
    simulated_runway_drop = round((amount / 100) * 1.5, 1) if amount > 0 else 0.0
    resilience_penalty = 1.5 if amount > 0 else 0.0

    new_runway = max(0.0, current_runway - simulated_runway_drop)
    new_score = max(0.0, current_score - resilience_penalty)

    # 4. 更新数据库 (包含打卡天数归零)
    update_user(user_id, {
        "financialSections": {**current_balances, "variableBudget": new_balance},
        "currentRunwayDays": round(new_runway, 1),
        "resilienceScore": round(new_score, 1),
        "consecutiveSafeDays": 0  # 冲动消费，社交打卡重置
    })

    # 5. 返回结果
    return ManualTransactionResponse(
        transactionId=str(uuid.uuid4()),
        runwayDrop=simulated_runway_drop,
        resilienceDelta=-resilience_penalty,
    )


def get_user_dashboard_data(user_id: str) -> UserDashboardResponse:
    """
    获取最新的仪表盘数据
    """
    user_data = get_user(user_id) or {}

    sections = user_data.get("financialSections", {
        "emergencyFund": 0.0,
        "fixedExpenses": 0.0,
        "futureExpenses": 0.0,
        "variableBudget": 0.0,
        "savingsPockets": 0.0
    })

    return UserDashboardResponse(
        runwayDays=user_data.get("currentRunwayDays", 45.2),
        resilienceScore=user_data.get("resilienceScore", 68.5),
        sectionsBalances=FinancialSections(**sections),
        recentTransactions=[] 
    )