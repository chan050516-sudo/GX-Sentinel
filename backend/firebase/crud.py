from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from google.cloud.firestore import SERVER_TIMESTAMP, ArrayUnion, CollectionReference, DocumentReference
from .init import get_firestore_client

# ========== 辅助函数 ==========
def _get_user_ref(user_id: str) -> DocumentReference:
    """返回用户文档引用"""
    db = get_firestore_client()
    return db.collection("users").document(user_id)

def _get_transactions_col(user_id: str) -> CollectionReference:
    """返回用户的交易子集合引用"""
    return _get_user_ref(user_id).collection("transactions")

def _get_interceptor_audit_col(user_id: str) -> CollectionReference:
    """返回用户的拦截审计子集合引用"""
    return _get_user_ref(user_id).collection("interceptorAudit")

def _get_goals_col(user_id: str) -> CollectionReference:
    """返回用户的目标子集合引用"""
    return _get_user_ref(user_id).collection("goals")

def _get_calendar_events_col(user_id: str) -> CollectionReference:
    """返回用户的日历事件子集合引用"""
    return _get_user_ref(user_id).collection("calendarEvents")

# ========== 用户操作 ==========
def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """
    获取用户文档，返回字典（包含 financialSections, currentRunwayDays 等）。
    如果不存在，返回 None。
    """
    doc_ref = _get_user_ref(user_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        # 确保 userId 字段存在（若 Firestore 中没有则补上）
        if "userId" not in data:
            data["userId"] = user_id
        return data
    return None

def update_user(user_id: str, updates: Dict[str, Any]) -> bool:
    """
    更新用户文档的部分字段。
    返回是否成功。
    """
    try:
        doc_ref = _get_user_ref(user_id)
        doc_ref.update(updates)
        return True
    except Exception as e:
        print(f"Error updating user {user_id}: {e}")
        return False

def create_user_if_not_exists(user_id: str, default_data: Optional[Dict[str, Any]] = None) -> bool:
    """
    如果用户不存在，则创建默认用户文档。
    default_data 可覆盖默认值。
    """
    if get_user(user_id) is not None:
        return True
    default = {
        "userId": user_id,
        "email": None,
        "displayName": f"User_{user_id}",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "currentRunwayDays": 30.0,
        "resilienceScore": 50.0,
        "totalIncome": 0.0,
        "totalOutflow": 0.0,
        "privilegeLevel": "bronze",
        "bonusPoints": 0,
        "financialSections": {
            "emergencyFund": 0.0,
            "fixedExpenses": 0.0,
            "futureExpenses": 0.0,
            "variableBudget": 0.0,
            "savingsPockets": 0.0,
        },
        "settings": {
            "defaultSpendingAllowance": 500,
            "notificationEnabled": True,
            "chromeExtEnabled": True,
        },
        "consecutiveSafeDays": 0,
    }
    if default_data:
        default.update(default_data)
    _get_user_ref(user_id).set(default)
    return True

# ========== 交易记录 ==========
def create_transaction(user_id: str, transaction_data: Dict[str, Any]) -> str:
    """
    创建一笔交易记录，自动生成 transactionId。
    返回 transactionId。
    """
    # 自动添加时间戳（如果没有）
    if "timestamp" not in transaction_data:
        transaction_data["timestamp"] = firestore.SERVER_TIMESTAMP
    # 生成文档 ID
    doc_ref = _get_transactions_col(user_id).document()
    transaction_id = doc_ref.id
    transaction_data["transactionId"] = transaction_id
    doc_ref.set(transaction_data)
    return transaction_id

def get_recent_transactions(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    获取最近的 limit 笔交易，按时间倒序。
    """
    col_ref = _get_transactions_col(user_id)
    # 按 timestamp 降序，限制数量
    docs = col_ref.order_by("timestamp", direction="DESC").limit(limit).stream()
    transactions = []
    for doc in docs:
        data = doc.to_dict()
        data["transactionId"] = doc.id
        transactions.append(data)
    return transactions

def get_similar_purchases_count(user_id: str, product_keyword: str, days: int = 30) -> int:
    """
    统计过去 days 天内，描述包含关键词的交易数量（不区分大小写模糊匹配）。
    需要查询 transactions 子集合。
    """
    # 计算时间界限
    since_date = datetime.now() - timedelta(days=days)
    col_ref = _get_transactions_col(user_id)
    # 注意：Firestore 不支持全文搜索，这里使用简单的字符串 contains 过滤（需要创建索引）
    # 如果你希望高性能，可以使用第三方搜索（如 Algolia），但此处演示用 client-side 过滤
    # 更好的方式：存储 products 数组并查询 array_contains，但这里产品名是单个字段 description
    # 我们先用 client-side 过滤，数据量小可接受
    docs = col_ref.where("timestamp", ">=", since_date).stream()
    count = 0
    keyword_lower = product_keyword.lower()
    for doc in docs:
        data = doc.to_dict()
        desc = data.get("description", "").lower()
        # 也可以检查 products 数组
        if keyword_lower in desc:
            count += 1
    return count

# ========== 拦截审计日志 ==========
def create_interceptor_audit(user_id: str, audit_data: Dict[str, Any]) -> str:
    """
    创建拦截审计记录，返回 auditId。
    """
    col_ref = _get_interceptor_audit_col(user_id)
    doc_ref = col_ref.document()
    audit_id = doc_ref.id
    audit_data["auditId"] = audit_id
    if "timestamp" not in audit_data:
        audit_data["timestamp"] = firestore.SERVER_TIMESTAMP
    doc_ref.set(audit_data)
    return audit_id

def get_interceptor_audit(user_id: str, audit_id: str) -> Optional[Dict[str, Any]]:
    """
    读取拦截审计记录。
    """
    doc_ref = _get_interceptor_audit_col(user_id).document(audit_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["auditId"] = audit_id
        return data
    return None

def update_interceptor_audit(user_id: str, audit_id: str, updates: Dict[str, Any]) -> None:
    """
    更新拦截审计记录的部分字段。
    """
    doc_ref = _get_interceptor_audit_col(user_id).document(audit_id)
    doc_ref.update(updates)

# ========== 目标管理 ==========
def get_user_goals(user_id: str) -> List[Dict[str, Any]]:
    """
    获取用户所有目标，返回列表。
    """
    col_ref = _get_goals_col(user_id)
    docs = col_ref.stream()
    goals = []
    for doc in docs:
        data = doc.to_dict()
        data["goalId"] = doc.id
        goals.append(data)
    return goals

def create_goal(user_id: str, goal_data: Dict[str, Any]) -> str:
    """
    创建新目标，返回 goalId。
    """
    col_ref = _get_goals_col(user_id)
    doc_ref = col_ref.document()
    goal_id = doc_ref.id
    goal_data["goalId"] = goal_id
    doc_ref.set(goal_data)
    return goal_id

# ========== 日历事件 ==========
def get_calendar_upcoming_expenses(user_id: str, days: int = 30) -> float:
    """
    计算未来 days 天内日历事件的预计支出总和。
    """
    now = datetime.now()
    future = now + timedelta(days=days)
    col_ref = _get_calendar_events_col(user_id)
    docs = col_ref.where("date", ">=", now).where("date", "<=", future).stream()
    total = 0.0
    for doc in docs:
        data = doc.to_dict()
        total += data.get("estimatedCost", 0.0)
    return total

def create_calendar_event(user_id: str, event_data: Dict[str, Any]) -> str:
    """创建日历事件，返回 eventId"""
    col_ref = _get_calendar_events_col(user_id)
    doc_ref = col_ref.document()
    event_id = doc_ref.id
    event_data["eventId"] = event_id
    doc_ref.set(event_data)
    return event_id

# ========== 韧性分数历史（可选） ==========
def add_resilience_history(user_id: str, history_data: Dict[str, Any]) -> str:
    """
    记录韧性分数历史（子集合 resilienceHistory）
    """
    col_ref = _get_user_ref(user_id).collection("resilienceHistory")
    doc_ref = col_ref.document()
    history_id = doc_ref.id
    history_data["id"] = history_id
    doc_ref.set(history_data)
    return history_id

# ========== 社交 / 奖励（顶层集合） ==========
def get_leaderboard(period: str = "weekly", limit: int = 50) -> List[Dict[str, Any]]:
    """
    从 socialResilience/leaderboard 集合中获取排行榜（按 period）
    注意：socialResilience 是顶层集合，不是用户子集合。
    """
    db = get_firestore_client()
    doc_ref = db.collection("socialResilience").document("leaderboard")
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        return data.get(period, [])[:limit]
    return []

def update_user_bonus(user_id: str, points: int, reason: str) -> None:
    """
    更新用户奖励积分，并记录 bonusHistory。
    存储路径：socialResilience/userBonuses/{userId}
    """
    db = get_firestore_client()
    bonus_ref = db.collection("socialResilience").document("userBonuses").collection("users").document(user_id)
    bonus_ref.set({
        "lastBonusDate": firestore.SERVER_TIMESTAMP,
        "bonusHistory": firestore.ArrayUnion([{
            "date": datetime.now(),
            "reason": reason,
            "points": points
        }])
    }, merge=True)
    # 同时更新用户文档中的 bonusPoints
    user = get_user(user_id)
    if user:
        current = user.get("bonusPoints", 0)
        update_user(user_id, {"bonusPoints": current + points})