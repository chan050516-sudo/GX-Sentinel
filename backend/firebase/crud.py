from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from google.cloud.firestore import CollectionReference, DocumentReference
from firebase_admin import firestore
from .init import get_firestore_client
from google.cloud.firestore_v1.base_query import FieldFilter

# ========== 辅助函数 ==========
def _get_user_ref(user_id: str) -> DocumentReference:
    db = get_firestore_client()
    return db.collection("users").document(user_id)

def _get_transactions_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("transactions")

def _get_interceptor_audit_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("interceptorAudit")

def _get_goals_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("goals")

def _get_calendar_events_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("calendarEvents")

def _get_income_injections_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("incomeInjections")

def _get_weekly_reports_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("weeklyReports")

def _get_chat_messages_col(user_id: str) -> CollectionReference:
    return _get_user_ref(user_id).collection("chatMessages")


# ========== User Operation ==========
def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    doc_ref = _get_user_ref(user_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        if "userId" not in data:
            data["userId"] = user_id
        return data
    return None

def update_user(user_id: str, updates: Dict[str, Any]) -> bool:
    try:
        doc_ref = _get_user_ref(user_id)
        doc_ref.update(updates)
        return True
    except Exception as e:
        print(f"Error updating user {user_id}: {e}")
        return False

def create_user_if_not_exists(user_id: str, default_data: Optional[Dict[str, Any]] = None) -> bool:
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



# ========== Income Injections ==========
def get_pending_injections(user_id: str) -> List[Dict[str, Any]]:
    col_ref = _get_income_injections_col(user_id)
    docs = col_ref.where("status", "==", "pending").stream()
    injections = []
    for doc in docs:
        data = doc.to_dict()
        data["injectionId"] = doc.id
        injections.append(data)
    return injections

def update_income_injection(user_id: str, injection_id: str, updates: Dict[str, Any]) -> None:
    doc_ref = _get_income_injections_col(user_id).document(injection_id)
    doc_ref.update(updates)

def create_income_injection(user_id: str, injection_data: Dict[str, Any]) -> str:

    col_ref = _get_income_injections_col(user_id)

    inj_id = injection_data.get("injectionId")
    if inj_id:
        doc_ref = col_ref.document(inj_id)
    else:
        doc_ref = col_ref.document()
        inj_id = doc_ref.id
        injection_data["injectionId"] = inj_id
    
    # Default value
    if "date" not in injection_data:
        injection_data["date"] = firestore.SERVER_TIMESTAMP
    if "status" not in injection_data:
        injection_data["status"] = "pending"
    if "allocatorUsed" not in injection_data:
        injection_data["allocatorUsed"] = False

    doc_ref.set(injection_data)
    return inj_id


# ========== Transaction ==========
def create_transaction(user_id: str, transaction_data: Dict[str, Any]) -> str:
    if "timestamp" not in transaction_data:
        transaction_data["timestamp"] = firestore.SERVER_TIMESTAMP
    doc_ref = _get_transactions_col(user_id).document()
    transaction_id = doc_ref.id
    transaction_data["transactionId"] = transaction_id
    doc_ref.set(transaction_data)
    return transaction_id

def get_recent_transactions(user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    col_ref = _get_transactions_col(user_id)
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

def get_last_aborted_transaction(user_id: str) -> Optional[str]:
    col_ref = _get_transactions_col(user_id)
    docs = col_ref.where("aborted", "==", True).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1).stream()
    for doc in docs:
        data = doc.to_dict()
        desc = data.get("description", "")
        amount = data.get("amount", 0)
        return f"{desc} (RM {amount:.0f})"
    return None

# ========== Interceptor Audit ==========
def create_interceptor_audit(user_id: str, audit_data: Dict[str, Any]) -> str:
    col_ref = _get_interceptor_audit_col(user_id)
    doc_ref = col_ref.document()
    audit_id = doc_ref.id
    audit_data["auditId"] = audit_id
    if "timestamp" not in audit_data:
        audit_data["timestamp"] = firestore.SERVER_TIMESTAMP
    doc_ref.set(audit_data)
    return audit_id

def get_interceptor_audit(user_id: str, audit_id: str) -> Optional[Dict[str, Any]]:
    doc_ref = _get_interceptor_audit_col(user_id).document(audit_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        data["auditId"] = audit_id
        return data
    return None

def update_interceptor_audit(user_id: str, audit_id: str, updates: Dict[str, Any]) -> None:
    doc_ref = _get_interceptor_audit_col(user_id).document(audit_id)
    doc_ref.update(updates)

# ========== Goals ==========
# Get goal list
def get_user_goals(user_id: str) -> List[Dict[str, Any]]:
    col_ref = _get_goals_col(user_id)
    docs = col_ref.stream()
    goals = []
    for doc in docs:
        data = doc.to_dict()
        data["goalId"] = doc.id
        goals.append(data)
    return goals

# Get specific goal info
def get_user_goal(user_id: str, goal_id: str) -> Optional[Dict[str, Any]]:
    doc_ref = _get_goals_col(user_id).document(goal_id)
    doc = doc_ref.get()
    return {**doc.to_dict(), "goalId": doc.id} if doc.exists else None

def update_user_goal(user_id: str, goal_id: str, updates: Dict[str, Any]) -> None:
    doc_ref = _get_goals_col(user_id).document(goal_id)
    doc_ref.update(updates)

def create_goal(user_id: str, goal_data: Dict[str, Any]) -> str:
    col_ref = _get_goals_col(user_id)
    doc_ref = col_ref.document()
    goal_id = doc_ref.id
    goal_data["goalId"] = goal_id
    doc_ref.set(goal_data)
    return goal_id

# ========== Calendar Events ==========
def get_upcoming_events(user_id: str, days: int = 30) -> List[Dict[str, Any]]:
    now = datetime.now()
    future = now + timedelta(days=days)
    col_ref = _get_calendar_events_col(user_id)
    
    # 【修复方案】：将 .filter(filter=...) 改回 .where(filter=...)
    # 这样既能使用 FieldFilter 消除警告，也能兼容旧版本的 CollectionReference 对象
    query = col_ref.where(filter=FieldFilter("date", ">=", now)) \
                   .where(filter=FieldFilter("date", "<=", future)) \
                   .order_by("date")
    
    docs = query.stream()
    events = []
    for doc in docs:
        data = doc.to_dict()
        events.append({
            "eventId": doc.id,
            "title": data.get("title", "Unknown"),
            "estimatedCost": data.get("estimatedCost", 0.0),
            "date": data.get("date"),
            "isRecurring": data.get("isRecurring", False),
            "subscriptionDetection": data.get("subscriptionDetection", False),
        })
    return events

def get_calendar_upcoming_expenses(user_id: str, days: int = 30) -> float:
    events = get_upcoming_events(user_id, days)
    return sum(event["estimatedCost"] for event in events)

def create_calendar_event(user_id: str, event_data: Dict[str, Any]) -> str:
    col_ref = _get_calendar_events_col(user_id)
    doc_ref = col_ref.document()
    event_id = doc_ref.id
    event_data["eventId"] = event_id
    doc_ref.set(event_data)
    return event_id

# ========== Resillence History ==========
def add_resilience_history(user_id: str, history_data: Dict[str, Any]) -> str:
    col_ref = _get_user_ref(user_id).collection("resilienceHistory")
    doc_ref = col_ref.document()
    history_id = doc_ref.id
    history_data["id"] = history_id
    doc_ref.set(history_data)
    return history_id

# ========== Bonus ==========
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