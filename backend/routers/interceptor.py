from fastapi import APIRouter, Header, HTTPException
from datetime import datetime
import uuid
from ..model.models import (
    InterceptorAnalyzeRequest, InterceptorAnalyzeResponse,
    InterceptorObservations, InterceptorJustifyRequest, InterceptorJustifyResponse,
    InterceptorOutcomeRequest, InterceptorOutcomeResponse,
)

router = APIRouter(prefix="/interceptor", tags=["interceptor"])

@router.post("/analyze", response_model=InterceptorAnalyzeResponse)
async def analyze_interception(req: InterceptorAnalyzeRequest, x_user_id: str = Header("demo_user_01")):
    audit_id = str(uuid.uuid4())
    # 队友会实现 analyze_transaction_rules，当前提供默认 fallback
    observations = InterceptorObservations(
        similarPurchasesCount=2,
        timeOfDay=datetime.now().strftime("%H:%M"),
        currentRunwayDays=45.0,
        transactionVariance=0.3,
        isNightTime=False,
    )
    return InterceptorAnalyzeResponse(
        triggerLevel="soft",
        auditId=audit_id,
        observations=observations,
        softMessage="Stub: You've made similar purchases. Just a heads-up!",
    )

@router.post("/justify", response_model=InterceptorJustifyResponse)
async def justify_purchase(req: InterceptorJustifyRequest, x_user_id: str = Header("demo_user_01")):
    # 队友实现 LLM 审核
    return InterceptorJustifyResponse(
        verdict="valid",
        reasoning="Stub: Your justification is accepted.",
        cognitiveMessage="Stay mindful of your goals.",
    )

@router.post("/outcome", response_model=InterceptorOutcomeResponse)
async def interceptor_outcome(req: InterceptorOutcomeRequest, x_user_id: str = Header("demo_user_01")):
    # 队友实现韧性分数更新和数据库写入
    return InterceptorOutcomeResponse(
        success=True,
        resilienceDelta=2.5 if req.userAction == "abort" else -1.2,
        runwayDrop=0.0 if req.userAction == "abort" else 3.5,
        newResilienceScore=70.0,
    )