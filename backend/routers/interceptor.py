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
    response_msg = await fast_llm.ainvoke([HumanMessage(content=prompt)])
    response = response_msg.content.strip().upper()
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
    runway_info = calculate_runway_impact(current_runway, req.totalAmount, avg_daily_spending, current_variable_balance)


    tier = 0
    intent_alert = None
    soft_message = ""
    require_justification = False
    observations = None
    impulse_score = 0.0
    factors = {}
    conflict_info = {"has_conflict": False, "conflict_message": ""}

    if req.paymentSource == "variableBudget":
        impulse_score, necessity_score, factors = calculate_impulse_score(
            product_name=product_desc,
            transaction_amount=req.totalAmount,
            transaction_time=transaction_time,
            user_variable_balance=current_variable_balance,
            avg_daily_spending=avg_daily_spending,
            similar_purchases_count=similar_count
        )
        tier = determine_tier(impulse_score)
        
        conflict_info = check_goal_conflict(req.totalAmount, goals, current_variable_balance)
        
        # Default response
        observations = InterceptorObservations(
            similarPurchasesCount=similar_count,
            timeOfDay=transaction_time.strftime("%H:%M"),
            currentRunwayDays=current_runway,
            transactionVariance=factors.get("amount_factor", 0.5),
            isNightTime=is_night
        )

        top_risks = get_top_risk_factors(factors)
        t1_msg = (
            f"⚠️ Heads up: System detected {top_risks}. "
            f"You are attempting to spend RM {req.totalAmount:.2f} while your remaining variable budget is only RM {current_variable_balance:.2f}."
            f"You currently hold a {consecutive_safe_days}-day perfect saving streak. Are you sure you want to break it?"
        )

        s1 = f"🚨 Financial Crisis Warning: {conflict_info['conflict_message']} " if conflict_info.get("has_conflict") else "🚨 "
        s1 += f"This transaction reduces your runway by {runway_info['runway_drop_days']} days and will heavily penalize your Resilience Score ({resilience_score})."

        s2 = ""
        if upcoming_events:
            next_event = upcoming_events[0]
            days_until = max(0, (next_event['date'] - datetime.now().astimezone()).days)
            s2 = f" Wake up to reality: Your next scheduled expense is '{next_event['title']}' (RM {next_event['estimatedCost']:.2f}) in {days_until} day(s)."
        elif upcoming_expenses_total > 0:
            s2 = f" Reminder: You have RM {upcoming_expenses_total:.2f} of upcoming financial obligations."
        
        s3 = f" Furthermore, you have already purchased {similar_count} similar items in the past 30 days." if similar_count > 0 else ""
        t2_msg = f"{t1_msg}\n{s1}{s2}{s3}"

        t3_msg = (
            f"{t2_msg}\n"
            f"🛑 TRANSACTION INTERCEPTED AND FROZEN! "
            f"Please provide an absolutely rational justification for why you MUST buy this right NOW. The AI Guardian will audit the logic of your statement."
        )

        if tier == 0:
            soft_message = "✅ Transaction seems reasonable. No action needed."
        elif tier == 1:
            soft_message = t1_msg
        elif tier == 2:
            soft_message = t2_msg
        else:
            soft_message = t3_msg
            require_justification = True

    else:
        observations = InterceptorObservations(
            similarPurchasesCount=similar_count,
            timeOfDay=transaction_time.strftime("%H:%M"),
            currentRunwayDays=current_runway,
            transactionVariance=0.5,
            isNightTime=is_night
        )
        
        if req.paymentSource == "emergencyFund":
            tier = 3
            intent_alert = "🛑 Emergency Fund Access"
            require_justification = True
            soft_message = f"⚠️ ATTEMPTING TO DRAIN EMERGENCY FUND for '{product_desc}'!\n🛑 Please provide a critical justification (e.g., medical, urgent repair) to unlock your life-line fund."
        else:
            reserved_titles = []
            if req.paymentSource == "fixedExpenses":
                reserved_titles = ["Monthly Rent / Rental / Housing", "Insurance Premiums", "Utilities", "Loans"]
            elif req.paymentSource == "savingsPockets":
                reserved_titles = [g['title'] for g in goals]
            elif req.paymentSource == "futureExpenses":
                reserved_titles = [e['title'] for e in upcoming_events]
            
            is_match, reason = await check_semantic_intent(product_desc, reserved_titles)
            
            if is_match:
                tier = 0
                intent_alert = "✅ Verified: Matches reserved obligations."
                soft_message = f"✅ Proceeding with reserved '{req.paymentSource}' for '{product_desc}'."
            else:
                tier = 3
                intent_alert = "⚠️ Misappropriation of Funds Detected."
                require_justification = True
                display_titles = reserved_titles[:2] if reserved_titles else ["this specific purpose"]
                soft_message = f"⚠️ INTENT MISMATCH: Your {req.paymentSource} is reserved for {display_titles}. Why are you diverting it for '{product_desc}'?\n🛑 TRANSACTION FROZEN! Please justify."


    tier_map = {0: "soft", 1: "soft", 2: "friction", 3: "critical"}
    final_tier_str = tier_map[tier]
    
    # Save goals snapshot and runway_info
    audit_id = str(uuid.uuid4())
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

    if tier == 0:
        audit_data["finalOutcome"] = "allowed"

    create_interceptor_audit(x_user_id, audit_data)

    return InterceptorAnalyzeResponse(
        triggerLevel=final_tier_str,
        auditId=audit_id,
        observations=observations,
        runwayDropDays=runway_info["runway_drop_days"] if tier > 1 else None,
        delaySeconds=5 if final_tier_str == "friction" else None,
        compoundLossExample=runway_info["compound_loss_example"] if tier > 1 else None,
        requireJustification=require_justification,
        intentAlert=intent_alert,
        softMessage=soft_message
    )

    
    


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
#     audit = get_interceptor_audit(x_user_id, req.auditId)
#     if not audit:
#         raise HTTPException(404, "Audit not found")
    
#     user_data = get_user(x_user_id)
#     if not user_data:
#         raise HTTPException(404, "User not found")
    
#     result = apply_outcome(x_user_id, audit, req.userAction, user_data)
    
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
    update_interceptor_audit(x_user_id, req.auditId, {
        "userAction": req.userAction,
        "finalOutcome": "aborted" if req.userAction == "abort" else "allowed"
    })
    return InterceptorOutcomeResponse(
        success=True,
        resilienceDelta=2.5 if req.userAction == "abort" else -1.2,
        runwayDrop=0.0 if req.userAction == "abort" else 3.5,
        newResilienceScore=70.0,
    )