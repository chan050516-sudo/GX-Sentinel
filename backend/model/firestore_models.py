from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from typing_extensions import Literal

from .models import FinancialSections, UserSettings, ProductInfo, InterceptorObservations


class FirestoreUser(BaseModel):
    userId: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    createdAt: datetime
    currentRunwayDays: float
    resilienceScore: float
    totalIncome: float
    totalOutflow: float
    privilegeLevel: Literal["bronze", "silver", "gold"]
    bonusPoints: float
    financialSections: FinancialSections
    settings: UserSettings
    consecutiveSafeDays: int


class FirestoreInterceptorAudit(BaseModel):
    auditId: str
    timestamp: datetime
    platform: str
    products: List[ProductInfo]
    totalAmount: float
    triggerLevel: str
    observations: InterceptorObservations
    userAction: Optional[str] = None
    justification: Optional[str] = None
    aiAuditResponse: Optional[str] = None
    finalOutcome: Optional[str] = None