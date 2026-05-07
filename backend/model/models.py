from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from typing_extensions import Literal


# ========== General ==========
class SuccessResponse(BaseModel):
    success: bool = True
    message: Optional[str] = None


# ========== User ==========
class FinancialSections(BaseModel):
    emergencyFund: float = 0.0
    fixedExpenses: float = 0.0
    futureExpenses: float = 0.0
    variableBudget: float = 0.0
    savingsPockets: float = 0.0


class UserDashboardResponse(BaseModel):
    runwayDays: float
    resilienceScore: float
    sectionsBalances: FinancialSections
    recentTransactions: List[Dict[str, Any]]  # 简化，避免循环引用


class UpdateUserSettingsRequest(BaseModel):
    defaultSpendingAllowance: Optional[float] = None
    notificationEnabled: Optional[bool] = None
    chromeExtEnabled: Optional[bool] = None


# ========== Module 1: Smart Allocation ==========
class AllocationRange(BaseModel):
    min: float
    max: float
    best: float


class RecommendedAllocation(BaseModel):
    emergencyFund: AllocationRange
    fixedExpenses: AllocationRange
    futureExpenses: AllocationRange
    variableBudget: AllocationRange
    savingsPockets: AllocationRange


# class AllocatorAnalyzeRequest(BaseModel):
#     amount: float
#     source: Literal["salary", "ptptn", "scholarship", "refund"]

class PendingIncomeItem(BaseModel):
    injectionId: str
    amount: float
    source: str
    description: Optional[str] = None

class AllocatorAnalyzeRequest(BaseModel):
    pendingIncomes: List[PendingIncomeItem]

class AllocatorAnalyzeResponse(BaseModel):
    isSmartMode: bool
    totalAmount: float
    recommendedAllocation: Optional['RecommendedAllocation'] = None
    adviceText: str
    investmentSuggestion: Optional[str] = None

class AllocatorConfirmRequest(BaseModel):
    injectionIds: List[str]                  # Confirm multiple pending transaction at once
    allocationMap: Dict[str, float]          # e.g. {"emergencyFund": 200}
    # goalAllocations: Optional[Dict[str, float]] = None

class AllocatorConfirmResponse(BaseModel):
    success: bool
    newBalances: FinancialSections
    runwayRecalc: float
    

# ========== Module 2: Interceptor ==========
class ProductInfo(BaseModel):
    name: str
    price: float


class InterceptorObservations(BaseModel):
    similarPurchasesCount: int
    timeOfDay: str
    currentRunwayDays: float
    transactionVariance: float
    isNightTime: bool


class InterceptorAnalyzeRequest(BaseModel):
    platform: Literal["shopee", "lazada", "manual"]
    products: List[ProductInfo]
    totalAmount: float
    isCheckoutPage: bool = True
    paymentSource: Literal["variableBudget", "emergencyFund", "savingsPockets", "fixedExpenses", "futureExpenses"] = "variableBudget"


class InterceptorAnalyzeResponse(BaseModel):
    triggerLevel: Literal["soft", "friction", "critical"]
    auditId: str
    observations: InterceptorObservations
    softMessage: Optional[str] = None
    intentAlert: Optional[str] = None   # For Internal Audit
    runwayDropDays: Optional[float] = None
    delaySeconds: Optional[int] = None
    compoundLossExample: Optional[str] = None
    requireJustification: Optional[bool] = None


class InterceptorJustifyRequest(BaseModel):
    auditId: str
    justification: str


class InterceptorJustifyResponse(BaseModel):
    verdict: Literal["valid", "invalid"]
    reasoning: str
    cognitiveMessage: str
    advice: Optional[str] = None


class InterceptorOutcomeRequest(BaseModel):
    auditId: str
    userAction: Literal["proceed", "abort"]


class InterceptorOutcomeResponse(BaseModel):
    success: bool
    resilienceDelta: float
    runwayDrop: float
    newResilienceScore: float


# ========== Module 3 & 4: Notification & Chat ==========
class ChatMessageRequest(BaseModel):
    message: str


class ChatMessageResponse(BaseModel):
    reply: str
    messageId: str


class ChatHistoryResponse(BaseModel):
    messages: List[Dict[str, Any]]


class WeeklyReportResponse(BaseModel):
    weekStart: datetime
    summary: str
    insights: Dict[str, Any]
    aiReportText: str


# ========== Module 5: Social Circle ==========
class LeaderboardEntry(BaseModel):
    anonymizedHandle: str
    resilienceScore: float
    rank: int


class LeaderboardResponse(BaseModel):
    weekly: List[LeaderboardEntry]
    monthly: List[LeaderboardEntry]


class BonusStatusResponse(BaseModel):
    bonusPoints: float
    lastBonusDate: Optional[datetime]
    nextBonusThreshold: str

class FriendStreak(BaseModel):
    name: str                 # 名字
    resilienceScore: float    # 当前分数
    currentStreak: int        # 连续大于 80 分的天数
    rewardStatus: str         # 奖励状态描述 (例如：解锁/还差几天)
    isEligible: bool          # 当前分数是否大于 80 (决定是否能累计天数)

class StreakChallengeResponse(BaseModel):
    challengeTitle: str       # 挑战的名称
    currentUser: FriendStreak # 你自己的打卡进度
    friends: List[FriendStreak] # 另外两个固定好友的打卡进度

# ========== Manual Transaction & Calendar/Goals ==========
class ManualTransactionRequest(BaseModel):
    amount: float
    category: str
    description: Optional[str] = None


class ManualTransactionResponse(BaseModel):
    transactionId: str
    runwayDrop: float
    resilienceDelta: float


class CalendarEventRequest(BaseModel):
    title: str
    category: str
    estimatedCost: float
    date: datetime
    isRecurring: bool = False


class CalendarEventResponse(BaseModel):
    eventId: str


class GoalResponse(BaseModel):
    goals: List[Dict[str, Any]]