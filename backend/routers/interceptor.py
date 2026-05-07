from fastapi import APIRouter, Header, HTTPException
from datetime import datetime, timedelta
from langchain_core.messages import HumanMessage
import uuid
from model.models import (
    InterceptorAnalyzeRequest, InterceptorAnalyzeResponse,
    InterceptorObservations, InterceptorJustifyRequest, InterceptorJustifyResponse,
    InterceptorOutcomeRequest, InterceptorOutcomeResponse,
)
from services.impulse_scorer import calculate_impulse_score, determine_tier
from services.runway import calculate_runway_impact, check_goal_conflict
from agents.graph_guardian import guardian_graph, GuardianState
from firebase.crud import (
    get_user, get_similar_purchases_count, get_user_goals,
    get_upcoming_events,
    get_last_aborted_transaction,
    create_user_if_not_exists,
    create_interceptor_audit, update_interceptor_audit, get_interceptor_audit
)
from core.llm import get_gemini_llm

router = APIRouter(prefix="/interceptor", tags=["interceptor"])
fast_llm = get_gemini_llm(temperature=0.0)

# Get the top risk observation in impulsive spending
def get_top_risk_factors(factors: dict) -> str:
    risk_map = {
        "night_factor": "late-night impulsive decision window",
        "amount_factor": "extreme deviation from average daily spending",
        "liquidity_factor": "heavy depletion of available variable balance",
        "frequency_factor": "consecutive stacking of similar purchases",
        "necessity_score": "acquisition of non-essential/luxury items"
    }
    
    sorted_factors = sorted(
        [(k, v) for k, v in factors.items() if k in risk_map and isinstance(v, (int, float)) and v > 0],
        key=lambda x: x[1],
        reverse=True
    )
    top_2 = [risk_map[k] for k, v in sorted_factors[:2]]
    return " and ".join(top_2) if top_2 else "impulsive buying patterns"

async def check_semantic_intent(product_name: str, reserved_titles: list) -> tuple[bool, str]:
    if not reserved_titles:
        return False, "No specific reserved purpose found."
    prompt = (
        f"Product/Service: '{product_name}'. "
        f"Reserved Fund Purposes: {reserved_titles}. "
        f"Does this product DIRECTLY fulfill any of these reserved purposes? "
        f"Answer STRICTLY with one word 'YES' or 'NO'."
    )
    response = await fast_llm.invoke([HumanMessage(content=prompt)]).content.strip().upper()
    is_match = response.startswith("YES")
    return is_match, "Matched" if is_match else "Mismatch"


@router.post("/analyze", response_model=InterceptorAnalyzeResponse)
async def analyze_interception(req: InterceptorAnalyzeRequest, x_user_id: str = Header("demo_user_01")):
    # 1. Get user financial status
    user_data = get_user(x_user_id)
    if not user_data:
        create_user_if_not_exists(x_user_id)
        user_data = get_user(x_user_id)
    financial_sections = user_data.get("financialSections", {})
    current_variable_balance = financial_sections.get("variableBudget", 0.0)
    current_runway = user_data.get("currentRunwayDays", 30.0)
    avg_daily_spending = user_data.get("totalOutflow", 2000) / 30.0 if user_data.get("totalOutflow") else 50.0
    goals = get_user_goals(x_user_id)
    upcoming_events = get_upcoming_events(x_user_id, days=30)
    upcoming_expenses_total = sum(e["estimatedCost"] for e in upcoming_events)
    # Psycological data
    consecutive_safe_days = user_data.get("consecutiveSafeDays", 0)
    resilience_score = user_data.get("resilienceScore", 0.0)
    last_aborted_item = get_last_aborted_transaction(x_user_id) or "None"
    # last_aborted_item = "Gaming keyboard (RM 299)"

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
        "paymentSource": req.paymentSource,
        "intentAlert": None,
        "products": [p.dict() for p in req.products],
        "totalAmount": req.totalAmount,
        "observations": observations.dict(),
        "impulseScore": impulse_score,
        "factors": factors,
        "runwayInfo": runway_info,
        "goalConflict": conflict_info,
        "goalsSnapshot": goals,
        "upcomingExpensesTotal": upcoming_expenses_total,
        # Save most recent 3 events
        "upcomingEventsPreview": [
            {
                "title": e["title"], 
                "cost": e["estimatedCost"], 
                "days": max(0, (e["date"] - datetime.now().astimezone()).days)
            }
            for e in upcoming_events[:3]
        ],
        "currentVariableBalance": current_variable_balance, 
        "behavioralContext": {
            "consecutiveSafeDays": consecutive_safe_days,
            "resilienceScore": resilience_score,
            "lastAbortedItem": last_aborted_item
        }
    }

    top_risks = get_top_risk_factors(factors)
    t1_msg = (
        f"⚠️ Heads up: System detected {top_risks}. "
        f"You are attempting to spend RM {req.totalAmount:.2f} while your remaining variable budget is only RM {current_variable_balance:.2f}."
        f"You currently hold a {consecutive_safe_days}-day perfect saving streak. Are you sure you want to break it?"
    )

    # Tier 2 msg: 3 lines punch
    # Line 1: Runway and Goal Conflict
    s1 = f"🚨 Financial Crisis Warning: {conflict_info['conflict_message']} " if conflict_info.get("has_conflict") else "🚨 "
    s1 += f"This transaction reduces your runway by {runway_info['runway_drop_days']} days and will heavily penalize your Resilience Score ({resilience_score})."

    # Line 2: Relate to calendar event
    s2 = ""
    if upcoming_events:
        next_event = upcoming_events[0]
        days_until = max(0, (next_event['date'] - datetime.now().astimezone()).days)
        s2 = (
            f" Wake up to reality: Your next scheduled expense is '{next_event['title']}' "
            f"(RM {next_event['estimatedCost']:.2f}) in {days_until} day(s)."
        )
    elif upcoming_expenses_total > 0:
        s2 = f" Reminder: You have RM {upcoming_expenses_total:.2f} of upcoming financial obligations."
    
    # Line 3: Transaction History
    s3 = f" Furthermore, you have already purchased {similar_count} similar items in the past 30 days." if similar_count > 0 else ""
    
    t2_msg = f"{t1_msg}\n{s1}{s2}{s3}"

    # Tier 3: Ask for Justification
    t3_msg = (
        f"{t2_msg}\n"
        f"🛑 TRANSACTION INTERCEPTED AND FROZEN! "
        f"Please provide an absolutely rational justification for why you MUST buy this right NOW. The AI Guardian will audit the logic of your statement."
    )


    intent_alert = None
    
    if req.paymentSource != "variableBudget":
        if req.paymentSource == "emergencyFund":
            tier = 3
            intent_alert = "🛑 Emergency Fund Access"
            t3_msg = f"⚠️ ATTEMPTING TO DRAIN EMERGENCY FUND for '{product_desc}'!\n\n{t2_msg}\n\n🛑 Please provide a critical justification to unlock your life-line fund."
        else:
            # fixedExpenses, futureExpenses, savingsPockets
            reserved_titles = []
            if req.paymentSource == "savingsPockets":
                reserved_titles = [g['title'] for g in goals if g.get('savedAmount', 0) < g.get('targetAmount', 0)]
            else:
                reserved_titles = [e['title'] for e in upcoming_events]
            
            is_match, reason = await check_semantic_intent(product_desc, reserved_titles)
            
            if is_match:
                intent_alert = "✅ Verified: Matches reserved obligations."
            else:
                tier = 3
                intent_alert = "⚠️ Misappropriation of Funds Detected."
                t3_msg = f"⚠️ INTENT MISMATCH: This pocket is reserved for specific obligations. Why are you diverting it for '{product_desc}'?\n\n{t2_msg}\n🛑 TRANSACTION FROZEN! Please justify."
    
    audit_data["intentAlert"] = intent_alert

    
    # Generate response based on tiers
    if tier == 0:
        # No Action
        response = InterceptorAnalyzeResponse(
            triggerLevel="soft",   # Simply response but will be skipped by frontend
            auditId=audit_id,
            observations=observations,
            intentAlert=intent_alert,
            softMessage="✅ Transaction seems reasonable. No action needed."
        )
        audit_data["triggerLevel"] = "soft"
        audit_data["finalOutcome"] = "allowed"
        create_interceptor_audit(x_user_id, audit_data)
        return response
    
    elif tier == 1:
        # Soft notification
        response = InterceptorAnalyzeResponse(
            triggerLevel="soft",
            auditId=audit_id,
            observations=observations,
            intentAlert=intent_alert,
            softMessage=t1_msg
        )
        audit_data["triggerLevel"] = "soft"
        create_interceptor_audit(x_user_id, audit_data)
        return response
    
    elif tier == 2:
        # Friction
        response = InterceptorAnalyzeResponse(
            triggerLevel="friction",
            auditId=audit_id,
            observations=observations,
            runwayDropDays=runway_info["runway_drop_days"],
            delaySeconds=5,
            compoundLossExample=runway_info["compound_loss_example"],
            intentAlert=intent_alert,
            softMessage=t2_msg
        )
        audit_data["triggerLevel"] = "friction"
        create_interceptor_audit(x_user_id, audit_data)
        return response
    
    else:  # tier == 3
        response = InterceptorAnalyzeResponse(
            triggerLevel="critical",
            auditId=audit_id,
            observations=observations,
            runwayDropDays=runway_info["runway_drop_days"],
            compoundLossExample=runway_info["compound_loss_example"],
            requireJustification=True,
            intentAlert=intent_alert,
            softMessage=t3_msg
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
        
    # Only handle critical tier
    if audit.get("triggerLevel") not in ["friction", "critical"]:
        raise HTTPException(
            status_code=400, 
            detail="Justification is only processed for Tier 2 or Tier 3 transactions."
        )
    
    # Current data from /analyze
    product_desc = audit["products"][0]["name"] if audit.get("products") else "item"
    transaction_amount = audit["totalAmount"]
    observations = audit.get("observations", {})
    behavioral_context = audit.get("behavioralContext", {})
    runway_info = audit.get("runwayInfo", {})
    goals = audit.get("goalsSnapshot", [])
    current_variable_balance = audit.get("currentVariableBalance", 0.0)
    upcoming_events_preview = audit.get("upcomingEventsPreview", [])
    goal_conflict = audit.get("goalConflict", {})
    python_conflict_message = goal_conflict.get("conflict_message", "No severe goal conflict detected.")
    
    # Drop the data into State
    initial_state = GuardianState(
        user_id=x_user_id,
        product_description=product_desc,
        transaction_amount=float(transaction_amount),
        transaction_time=observations.get("timeOfDay", "Unknown"),
        user_justification=req.justification,
        context_data={
            "payment_source": audit.get("paymentSource", "variableBudget"),
            "intent_alert": audit.get("intentAlert"),
            "runway_drop_days": runway_info.get("runway_drop_days"),
            "current_runway": observations.get("currentRunwayDays"),
            "similar_purchases": observations.get("similarPurchasesCount"),
            "goals": goals,
            "current_variable_balance": current_variable_balance,
            "python_conflict_message": python_conflict_message,
            "consecutive_safe_days": behavioral_context.get("consecutiveSafeDays", 0),
            "resilience_score": behavioral_context.get("resilienceScore", 0),
            "last_aborted_item": behavioral_context.get("lastAbortedItem", "None"),
            "upcoming_events": upcoming_events_preview
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
        cognitiveMessage=final_state["cognitive_message"],
        advice=final_state.get("advice")
    )


# @router.post("/outcome", response_model=InterceptorOutcomeResponse)
# async def interceptor_outcome(req: InterceptorOutcomeRequest, x_user_id: str = Header("demo_user_01")):
#     # 1. 获取审计记录和用户当前状态
#     audit = get_interceptor_audit(x_user_id, req.auditId)
#     if not audit:
#         raise HTTPException(404, "Audit not found")
    
#     user_data = get_user(x_user_id)
#     if not user_data:
#         raise HTTPException(404, "User not found")
    
#     # 2. 根据 action 执行更新
#     result = apply_outcome(x_user_id, audit, req.userAction, user_data)
    
#     # 3. 更新审计最终结果
#     update_interceptor_audit(x_user_id, req.auditId, {
#         "userAction": req.userAction,
#         "finalOutcome": "aborted" if req.userAction == "abort" else "allowed"
#     })
    
#     return InterceptorOutcomeResponse(
#         success=True,
#         resilienceDelta=result["resilience_delta"],
#         runwayDrop=result["runway_drop"],
#         newResilienceScore=result["new_resilience_score"]
#     )


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