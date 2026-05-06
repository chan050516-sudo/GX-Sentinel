from typing import Optional, Dict, Any, List

def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """返回用户文档(mock demo 数据）"""
    # TODO: 队友实现
    # 返回空壳 Demo 数据，让前端能跑通
    return {
        "userId": user_id,
        "currentRunwayDays": 45.0,
        "resilienceScore": 68.5,
        "financialSections": {
            "emergencyFund": 1500,
            "fixedExpenses": 800,
            "futureExpenses": 300,
            "variableBudget": 400,
            "savingsPockets": 200,
        },
        "totalOutflow": 2300,
        "consecutiveSafeDays": 3,
    }
 
def update_user(user_id: str, updates: Dict[str, Any]) -> bool:
    """更新用户（队友实现）"""
    pass

def create_transaction(user_id: str, transaction_data: Dict[str, Any]) -> str:
    """创建交易记录（队友实现）"""
    pass

def create_interceptor_audit(user_id: str, audit_data: Dict[str, Any]) -> str:
    """创建审计日志（队友实现）"""
    pass

def update_interceptor_audit(user_id: str, audit_id: str, updates: Dict[str, Any]) -> None:
    """更新审计记录（队友实现）"""
    pass

def get_recent_transactions(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """获取最近交易(mock)"""
    return []  # 或空列表