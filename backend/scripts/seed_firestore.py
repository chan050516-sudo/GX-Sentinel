import os
import sys
from datetime import datetime, timedelta
from typing import Any, Dict, List

# add backend path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from firebase.init import init_firebase, get_firestore_client


# ========== Current data as baseline ==========
NOW = datetime(2026, 5, 6, 0, 0, 0)

CREATED_AT = datetime(2026, 3, 1, 10, 0, 0)           # User created at
INJ_APR_DATE = datetime(2026, 4, 1, 0, 0, 0)           # last month salary
INJ_MAY_DATE = datetime(2026, 5, 1, 0, 0, 0)           # current month salary
TX_SHOPEE_DATE = datetime(2026, 5, 4, 22, 15, 0)       # 3 days before
TX_LUNCH_DATE = datetime(2026, 5, 5, 12, 30, 0)        # yesterday
TX_NETFLIX_DATE = datetime(2026, 5, 2, 8, 0, 0)        # 4 days before
TX_ABORTED_DATE = datetime(2026, 5, 3, 23, 45, 0)      # 3 days before
AUDIT_SHOPEE_DATE = datetime(2026, 5, 4, 22, 15, 0)    # 3 days before
AUDIT_KEYBOARD_DATE = datetime(2026, 5, 3, 23, 45, 0)  # 3 days before
GOAL_EMERGENCY_DEADLINE = datetime(2026, 9, 1, 0, 0, 0)   # 4 months after
GOAL_VACATION_DEADLINE = datetime(2026, 8, 15, 0, 0, 0)    # 3 months after
CAL_MOVIE_DATE = datetime(2026, 5, 10, 19, 0, 0)        # 4 months after
CAL_DENTIST_DATE = datetime(2026, 5, 15, 10, 0, 0)      # 9 days after
CHAT_MSG_DATE = datetime(2026, 5, 5, 14, 20, 0)         # yesterday
WEEK_REPORT_DATE = "2026-W18"
WEEK_REPORT_GENERATED = datetime(2026, 5, 5, 2, 0, 0)   # yesterday generated
BONUS_DATE = datetime(2026, 5, 1, 0, 0, 0)              # 5 days before


# ========== Mock Data ==========

# 1. User
USER_DATA = {
    "userId": "demo_user_01",
    "email": "demo@gx-sentinel.com",
    "displayName": "Alex Tan",
    "createdAt": CREATED_AT,
    "currentRunwayDays": 42.5,
    "resilienceScore": 68.3,
    "totalIncome": 5800.0,
    "totalOutflow": 3450.0,
    "privilegeLevel": "bronze",
    "bonusPoints": 120,
    "financialSections": {
        "emergencyFund": 1850.0,
        "fixedExpenses": 900.0,
        "futureExpenses": 420.0,
        "variableBudget": 530.0,
        "savingsPockets": 210.0,
    },
    "settings": {
        "defaultSpendingAllowance": 600,
        "notificationEnabled": True,
        "chromeExtEnabled": True,
    },
    "consecutiveSafeDays": 3,
}

# 2. Income Injection
INCOME_INJECTIONS = [
    {
        "injectionId": "inj_apr_salary",
        "amount": 4200.0,
        "source": "salary",
        "date": INJ_APR_DATE,
        "allocatorUsed": True,
        "allocatorRecommendation": {
            "recommendedAmounts": {
                "emergencyFund": 800,
                "fixedExpenses": 500,
                "futureExpenses": 400,
                "variableBudget": 700,
                "savingsPockets": 1800,
            },
            "userFinalAllocation": {
                "emergencyFund": 800,
                "fixedExpenses": 500,
                "futureExpenses": 400,
                "variableBudget": 700,
                "savingsPockets": 1800,
            },
        },
        "adviceText": "Your emergency fund is healthy. Consider allocating more to future expenses for upcoming travel.",
    },
    {
        "injectionId": "inj_may_scholar",
        "amount": 1500.0,
        "source": "scholarship",
        "date": INJ_MAY_DATE,
        "allocatorUsed": True,
        "allocatorRecommendation": {
            "recommendedAmounts": {
                "emergencyFund": 300,
                "fixedExpenses": 200,
                "futureExpenses": 400,
                "variableBudget": 200,
                "savingsPockets": 400,
            },
            "userFinalAllocation": {
                "emergencyFund": 400,
                "fixedExpenses": 200,
                "futureExpenses": 400,
                "variableBudget": 200,
                "savingsPockets": 300,
            },
        },
        "adviceText": "Great job saving 30% of scholarship. Keep building your emergency cushion.",
    },
]

# 3. Transactions
TRANSACTIONS = [
    {
        "transactionId": "tx_shopee_1",
        "type": "outflow",
        "amount": 189.0,
        "category": "shopping",
        "description": "Wireless earphones (Shopee)",
        "timestamp": TX_SHOPEE_DATE,
        "isImpulse": True,
        "intercepted": True,
        "interceptionResult": {
            "justification": "My old earphones broke, need replacement",
            "aiVerdict": "invalid",
            "runwayDrop": 2.3,
            "resilienceDelta": -4.2,
        },
        "aborted": False,
        "abortedReward": None,
    },
    {
        "transactionId": "tx_lunch_1",
        "type": "outflow",
        "amount": 18.5,
        "category": "food",
        "description": "Lunch at food court",
        "timestamp": TX_LUNCH_DATE,
        "isImpulse": False,
        "intercepted": False,
        "interceptionResult": None,
        "aborted": False,
        "abortedReward": None,
    },
    {
        "transactionId": "tx_netflix",
        "type": "outflow",
        "amount": 45.0,
        "category": "subscription",
        "description": "Netflix monthly",
        "timestamp": TX_NETFLIX_DATE,
        "isImpulse": False,
        "intercepted": False,
        "interceptionResult": None,
        "aborted": False,
        "abortedReward": None,
    },
    {
        "transactionId": "tx_aborted_1",
        "type": "outflow",
        "amount": 299.0,
        "category": "shopping",
        "description": "Gaming keyboard (cancelled)",
        "timestamp": TX_ABORTED_DATE,
        "isImpulse": False,
        "intercepted": True,
        "interceptionResult": None,
        "aborted": True,
        "abortedReward": 3.2,
    },
]

# 4. Interceptor Audits
INTERCEPTOR_AUDITS = [
    {
        "auditId": "audit_shopee_1",
        "timestamp": AUDIT_SHOPEE_DATE,
        "platform": "shopee",
        "products": [{"name": "Wireless Earphones", "price": 189.0}],
        "totalAmount": 189.0,
        "triggerLevel": "critical",
        "observations": {
            "similarPurchasesCount": 2,
            "timeOfDay": "22:15",
            "currentRunwayDays": 44.8,
            "transactionVariance": 0.6,
            "isNightTime": True,
        },
        "userAction": "proceed",
        "justification": "My old earphones broke, need replacement",
        "aiAuditResponse": "Buying at night after 2 similar purchases this month conflicts with your savings goal. This is likely impulse.",
        "finalOutcome": "allowed",
    },
    {
        "auditId": "audit_keyboard_1",
        "timestamp": AUDIT_KEYBOARD_DATE,
        "platform": "lazada",
        "products": [{"name": "Mechanical Keyboard", "price": 299.0}],
        "totalAmount": 299.0,
        "triggerLevel": "critical",
        "observations": {
            "similarPurchasesCount": 0,
            "timeOfDay": "23:45",
            "currentRunwayDays": 45.2,
            "transactionVariance": 0.9,
            "isNightTime": True,
        },
        "userAction": "abort",
        "justification": "I want it but don't really need",
        "aiAuditResponse": "Night purchase with weak justification. High impulse > recommended to abort.",
        "finalOutcome": "aborted",
    },
]

# 5. Resillence History
RESILIENCE_HISTORY = [
    {
        "date": "2026-05-05",
        "score": 68.3,
        "components": {
            "runwayStability": 0.72,
            "impulseRatio": 0.18,
            "savingsConsistency": 0.55,
            "spendingVolatility": 0.32,
        },
        "updateTrigger": "dailyScheduler",
    },
    {
        "date": "2026-05-04",
        "score": 72.5,
        "components": {
            "runwayStability": 0.74,
            "impulseRatio": 0.12,
            "savingsConsistency": 0.58,
            "spendingVolatility": 0.28,
        },
        "updateTrigger": "transaction",
    },
    {
        "date": "2026-05-03",
        "score": 75.2,
        "components": {
            "runwayStability": 0.76,
            "impulseRatio": 0.10,
            "savingsConsistency": 0.60,
            "spendingVolatility": 0.25,
        },
        "updateTrigger": "dailyScheduler",
    },
]

# 6. Goals
GOALS = [
    {
        "goalId": "goal_emergency_6k",
        "title": "Build 6-month emergency fund",
        "targetAmount": 6000.0,
        "savedAmount": 1850.0,
        "deadline": GOAL_EMERGENCY_DEADLINE,
        "priority": 1,
        "createdAt": CREATED_AT,
    },
    {
        "goalId": "goal_vacation_bali",
        "title": "Bali vacation fund",
        "targetAmount": 3000.0,
        "savedAmount": 800.0,
        "deadline": GOAL_VACATION_DEADLINE,
        "priority": 2,
        "createdAt": datetime(2026, 3, 10, 8, 30, 0),
    },
]

# 7. Calendar Events
CALENDAR_EVENTS = [
    {
        "eventId": "event_movie_may10",
        "title": "Movie with friends",
        "category": "entertainment",
        "estimatedCost": 45.0,
        "date": CAL_MOVIE_DATE,
        "isRecurring": False,
        "subscriptionDetection": False,
    },
    {
        "eventId": "event_dentist_may15",
        "title": "Dentist appointment",
        "category": "healthcare",
        "estimatedCost": 250.0,
        "date": CAL_DENTIST_DATE,
        "isRecurring": False,
        "subscriptionDetection": False,
    },
]

# 8. Chat Messages
CHAT_MESSAGES = [
    {
        "messageId": "msg_1",
        "role": "user",
        "content": "How can I reduce impulse spending?",
        "timestamp": CHAT_MSG_DATE,
        "messageType": "chat",
    },
    {
        "messageId": "msg_2",
        "role": "assistant",
        "content": "Try the 24-hour rule: wait a day before buying non-essentials. Also enable our Chrome extension to get real-time nudges!",
        "timestamp": CHAT_MSG_DATE + timedelta(seconds=5),
        "messageType": "chat",
    },
    {
        "messageId": "msg_3",
        "role": "user",
        "content": "Is my emergency fund on track?",
        "timestamp": CHAT_MSG_DATE - timedelta(days=1),
        "messageType": "chat",
    },
    {
        "messageId": "msg_4",
        "role": "assistant",
        "content": "Your emergency fund is at RM1,850, about 31% of your RM6,000 goal. You're making good progress! At your current savings rate, you'll reach it in 4 months.",
        "timestamp": CHAT_MSG_DATE - timedelta(days=1, seconds=10),
        "messageType": "chat",
    },
]

# 9. Weekly Report
WEEKLY_REPORTS = [
    {
        "weekStartDate": WEEK_REPORT_DATE,
        "generatedAt": WEEK_REPORT_GENERATED,
        "summary": "You resisted one major impulse (RM299) but made a late-night earphone purchase. Your runway decreased by 2.3 days.",
        "insights": {
            "runwayChange": -2.3,
            "impulseCount": 2,
            "topCategory": "shopping",
            "savingsRate": 0.18,
            "resilienceImprovement": -4.2,
        },
        "aiReportText": "Alex, your spending on electronics increased this week. Consider setting a saving target for tech gadgets. Your emergency fund is still below goal – try to allocate 15% of next salary to it.",
    },
]

# 10. Social Leaderboard (Collection On Top)
SOCIAL_LEADERBOARD = {
    "weekly": [
        {"userId": "user_saver_88", "anonymizedHandle": "ThriftyDragon", "resilienceScore": 91.2, "rank": 1},
        {"userId": "user_budget_pro", "anonymizedHandle": "CashKeeper", "resilienceScore": 85.7, "rank": 2},
        {"userId": "demo_user_01", "anonymizedHandle": "AlexT", "resilienceScore": 68.3, "rank": 15},
        {"userId": "user_impulse_1", "anonymizedHandle": "Spender", "resilienceScore": 42.5, "rank": 42},
    ],
    "monthly": [
        {"userId": "user_saver_88", "anonymizedHandle": "ThriftyDragon", "resilienceScore": 89.5, "rank": 1},
        {"userId": "demo_user_01", "anonymizedHandle": "AlexT", "resilienceScore": 71.0, "rank": 12},
    ],
}

# 11. User Bonus
USER_BONUS = {
    "lastBonusDate": BONUS_DATE,
    "bonusHistory": [
        {"date": BONUS_DATE, "reason": "7_day_high_score", "points": 50},
        {"date": datetime(2026, 4, 20, 0, 0, 0), "reason": "first_aborted_impulse", "points": 20},
    ],
}


def inject_user_data(db, user_id: str):
    print(f"User created: {user_id}")
    db.collection("users").document(user_id).set(USER_DATA)


def inject_income_injections(db, user_id: str):
    print(f"Income injected ...")
    col_ref = db.collection("users").document(user_id).collection("incomeInjections")
    for data in INCOME_INJECTIONS:
        doc_id = data["injectionId"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_transactions(db, user_id: str):
    print(f"Transaction injected ...")
    col_ref = db.collection("users").document(user_id).collection("transactions")
    for data in TRANSACTIONS:
        doc_id = data["transactionId"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_interceptor_audits(db, user_id: str):
    print(f"Interceptor audits created...")
    col_ref = db.collection("users").document(user_id).collection("interceptorAudit")
    for data in INTERCEPTOR_AUDITS:
        doc_id = data["auditId"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_resilience_history(db, user_id: str):
    print(f"Resillence score history created...")
    col_ref = db.collection("users").document(user_id).collection("resilienceHistory")
    for data in RESILIENCE_HISTORY:
        date = data["date"]
        print(f"    - {date}")
        col_ref.document(date).set(data)


def inject_goals(db, user_id: str):
    print(f"Goals injected...")
    col_ref = db.collection("users").document(user_id).collection("goals")
    for data in GOALS:
        doc_id = data["goalId"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_calendar_events(db, user_id: str):
    print(f"Calendar events created ...")
    col_ref = db.collection("users").document(user_id).collection("calendarEvents")
    for data in CALENDAR_EVENTS:
        doc_id = data["eventId"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_chat_messages(db, user_id: str):
    print(f"Chat history craeted ...")
    col_ref = db.collection("users").document(user_id).collection("chatMessages")
    for data in CHAT_MESSAGES:
        doc_id = data["messageId"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_weekly_reports(db, user_id: str):
    print(f"Weekly report generated ...")
    col_ref = db.collection("users").document(user_id).collection("weeklyReports")
    for data in WEEKLY_REPORTS:
        doc_id = data["weekStartDate"]
        print(f"    - {doc_id}")
        col_ref.document(doc_id).set(data)


def inject_social_leaderboard(db):
    print(f"Social leaderboard created ...")
    doc_ref = db.collection("socialResilience").document("leaderboard")
    doc_ref.set(SOCIAL_LEADERBOARD)


def inject_user_bonus(db, user_id: str):
    print(f"User bonus generated ...")
    collection_ref = (
        db.collection("socialResilience")
        .document("userBonuses")
        .collection("users")
    )
    collection_ref.document(user_id).set(USER_BONUS)


def main():
    print("\n" + "=" * 60)
    print("🔥 GX-Sentinel Firestore Mock Data Injection")
    print(f"Current date baseline: {NOW.strftime('%Y-%m-%d')}")
    print("=" * 60 + "\n")

    # Initialize Firebase
    print("Initialize Firebase connection...")
    try:
        init_firebase()
        db = get_firestore_client()
        print("✅ Firebase connected\n")
    except Exception as e:
        print(f"❌ Firebase connection failed: {e}")
        sys.exit(1)

    user_id = "demo_user_01"

    print(f"📦 Start inject mock data (userId: {user_id})\n")

    try:
        inject_user_data(db, user_id)
        inject_income_injections(db, user_id)
        inject_transactions(db, user_id)
        inject_interceptor_audits(db, user_id)
        inject_resilience_history(db, user_id)
        inject_goals(db, user_id)
        inject_calendar_events(db, user_id)
        inject_chat_messages(db, user_id)
        inject_weekly_reports(db, user_id)
        inject_social_leaderboard(db)
        inject_user_bonus(db, user_id)

        print("\n" + "=" * 60)
        print("✅ All Mock data injected！")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Data Injection failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()