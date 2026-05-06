from fastapi import APIRouter, Header, HTTPException
from datetime import datetime
import uuid
from ..model.models import (
    InterceptorAnalyzeRequest, InterceptorAnalyzeResponse,
    InterceptorObservations, InterceptorJustifyRequest, InterceptorJustifyResponse,
    InterceptorOutcomeRequest, InterceptorOutcomeResponse,
)
from ..services.impulse_scorer import calculate_impulse_score, determine_tier
from ..services.runway import calculate_runway_impact, check_goal_conflict
from ..agents.graph_guardian import guardian_graph, GuardianState
from ..firebase.crud import (
    get_user, get_similar_purchases_count, get_user_goals, get_calendar_upcoming_expenses,
    create_interceptor_audit, update_interceptor_audit, get_interceptor_audit
)

router = APIRouter(prefix="/interceptor", tags=["interceptor"])

@router.post("/analyze", response_model=InterceptorAnalyzeResponse)
async def analyze_interception(req: InterceptorAnalyzeRequest, x_user_id: str = Header("demo_user_01")):
    # 1. Get user financial status
    user_data = get_user(x_user_id)
    financial_sections = user_data.get("financialSections", {})
    current_variable_balance = financial_sections.get("variableBudget", 0.0)
    current_runway = user_data.get("currentRunwayDays", 30.0)
    avg_daily_spending = user_data.get("totalOutflow", 2000) / 30.0 if user_data.get("totalOutflow") else 50.0
    goals = get_user_goals(x_user_id)
    upcoming_expenses = get_calendar_upcoming_expenses(x_user_id, days=30)

    # 2. Get Similar Purchases Count，from transactions in DB
    product_desc = req.products[0].name if req.products else "item"
    similar_count = get_similar_purchases_count(x_user_id, product_desc, days=30)

    # 3. Calculate impulse score and tier
    transaction_time = datetime.now()
    hour = transaction_time.hour
    is_night = (hour >= 23 or hour < 5)
    impulse_score, necessity_score, factors = calculate_impulse_score(
        product_name=product_desc,
        transaction_amount=req.totalAmount,
        transaction_time=transaction_time,
        user_variable_balance=current_variable_balance,
        avg_daily_spending=avg_daily_spending,
        similar_purchases_count=similar_count
    )
    tier = determine_tier(impulse_score)
    

    runway_info = calculate_runway_impact(current_runway, req.totalAmount, avg_daily_spending, current_variable_balance)
    conflict_info = check_goal_conflict(req.totalAmount, goals, current_variable_balance)
    
    # Default response
    audit_id = str(uuid.uuid4())
    observations = InterceptorObservations(
        similarPurchasesCount=similar_count,
        timeOfDay=transaction_time.strftime("%H:%M"),
        currentRunwayDays=current_runway,
        transactionVariance=factors.get("amount_factor", 0.5),
        isNightTime=is_night
    )
    
    # Save goals snapshot and runway_info
    audit_data = {
        "auditId": audit_id,
        "timestamp": transaction_time,
        "platform": req.platform,
        "products": [p.dict() for p in req.products],
        "totalAmount": req.totalAmount,
        "observations": observations.dict(),
        "impulseScore": impulse_score,
        "factors": factors,
        "runwayInfo": runway_info,
        "goalConflict": conflict_info,
        "goalsSnapshot": goals,
        "upcomingExpenses": upcoming_expenses,
    }
    
    # Generate response based on tiers
    if tier == 0:
        # No Action
        response = InterceptorAnalyzeResponse(
            triggerLevel="soft",   # Simply response but will be skipped by frontend
            auditId=audit_id,
            observations=observations,
            softMessage="✅ Transaction seems reasonable. No action needed."
        )
        audit_data["triggerLevel"] = "soft"
        audit_data["finalOutcome"] = "allowed"
        create_interceptor_audit(x_user_id, audit_data)
        return response
    
    elif tier == 1:
        # Soft notification
        msg = f"⚠️ Heads up! You've bought {similar_count} similar items this month."
        if conflict_info["has_conflict"]:
            msg += " " + conflict_info["conflict_message"]
        response = InterceptorAnalyzeResponse(
            triggerLevel="soft",
            auditId=audit_id,
            observations=observations,
            softMessage=msg
        )
        audit_data["triggerLevel"] = "soft"
        create_interceptor_audit(x_user_id, audit_data)
        return response
    
    elif tier == 2:
        # Friction
        msg = f"⏳ This purchase would reduce your financial runway by {runway_info['runway_drop_days']} days."
        if conflict_info["has_conflict"]:
            msg += " " + conflict_info["conflict_message"]
        response = InterceptorAnalyzeResponse(
            triggerLevel="friction",
            auditId=audit_id,
            observations=observations,
            runwayDropDays=runway_info["runway_drop_days"],
            delaySeconds=5,
            compoundLossExample=runway_info["compound_loss_example"],
            softMessage=msg
        )
        audit_data["triggerLevel"] = "friction"
        create_interceptor_audit(x_user_id, audit_data)
        return response
    
    else:  # tier == 3
        msg = f"❗ Critical: This purchase would reduce your runway by {runway_info['runway_drop_days']} days."
        if conflict_info["has_conflict"]:
            msg += " " + conflict_info["conflict_message"]
        response = InterceptorAnalyzeResponse(
            triggerLevel="critical",
            auditId=audit_id,
            observations=observations,
            runwayDropDays=runway_info["runway_drop_days"],
            compoundLossExample=runway_info["compound_loss_example"],
            requireJustification=True,
            softMessage=msg
        )
        audit_data["triggerLevel"] = "critical"
        create_interceptor_audit(x_user_id, audit_data)
        return response


@router.post("/justify", response_model=InterceptorJustifyResponse)
async def justify_purchase(
    req: InterceptorJustifyRequest,
    x_user_id: str = Header("demo_user_01")
):
    audit = get_interceptor_audit(x_user_id, req.auditId)
    if not audit:
        raise HTTPException(status_code=404, detail="Audit record not found")
        
    # [新增防御]：大模型只处理高级别威胁
    if audit.get("triggerLevel") not in ["friction", "critical"]:
        raise HTTPException(
            status_code=400, 
            detail="Justification is only processed for Tier 2 or Tier 3 transactions."
        )
    
    # 提取已有的缓存数据，拒绝重复计算
    product_desc = audit["products"][0]["name"] if audit.get("products") else "item"
    transaction_amount = audit["totalAmount"]
    observations = audit.get("observations", {})
    runway_info = audit.get("runwayInfo", {})
    goals = audit.get("goalsSnapshot", [])
    current_variable_balance = audit.get("observations", {}).get("currentVariableBalance")
    
    # 把数据全部塞给 State
    initial_state = GuardianState(
        user_id=x_user_id,
        product_description=product_desc,
        transaction_amount=float(transaction_amount),
        transaction_time=observations.get("timeOfDay", "Unknown"),
        user_justification=req.justification,
        context_data={
            "runway_drop_days": runway_info.get("runway_drop_days"),
            "current_runway": observations.get("currentRunwayDays"),
            "similar_purchases": observations.get("similarPurchasesCount"),
            "goals": goals,
            "current_variable_balance": current_variable_balance
        },
        verdict="", reasoning="", cognitive_message=""
    )
    
    final_state = guardian_graph.invoke(initial_state)
    
    update_interceptor_audit(
        user_id=x_user_id,
        audit_id=req.auditId,
        updates={
            "justification": req.justification,
            "aiAuditResponse": final_state["reasoning"],
            "aiVerdict": final_state["verdict"],
            "finalOutcome": None
        }
    )
    
    return InterceptorJustifyResponse(
        verdict=final_state["verdict"],
        reasoning=final_state["reasoning"],
        cognitiveMessage=final_state["cognitive_message"]
    )


@router.post("/outcome", response_model=InterceptorOutcomeResponse)
async def interceptor_outcome(req: InterceptorOutcomeRequest, x_user_id: str = Header("demo_user_01")):
    # 更新审计记录最终动作
    update_interceptor_audit(x_user_id, req.auditId, {
        "userAction": req.userAction,
        "finalOutcome": "aborted" if req.userAction == "abort" else "allowed"
    })
    # 韧性分数和交易记录的更新逻辑由其他服务处理（此处返回模拟）
    # 实际应调用 resilience_service 完成
    return InterceptorOutcomeResponse(
        success=True,
        resilienceDelta=2.5 if req.userAction == "abort" else -1.2,
        runwayDrop=0.0 if req.userAction == "abort" else 3.5,
        newResilienceScore=70.0,
    )