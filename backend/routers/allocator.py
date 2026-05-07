from fastapi import APIRouter, Header
import uuid, datetime
from model.models import (
    AllocatorAnalyzeRequest, AllocatorAnalyzeResponse,
    AllocatorConfirmRequest, AllocatorConfirmResponse,
    FinancialSections,
)
from agents.graph_allocator import allocator_graph
from firebase.crud import get_user, update_user, get_user_goals, update_user_goal
from services.runway import calculate_auto_goal_allocations

router = APIRouter(prefix="/allocator", tags=["allocator"])

@router.post("/analyze", response_model=AllocatorAnalyzeResponse)
async def analyze_allocation(req: AllocatorAnalyzeRequest, x_user_id: str = Header("demo_user_01")):

    total_amount = sum(item.amount for item in req.pendingIncomes)
    sources = [item.source for item in req.pendingIncomes]
    
    # Threshold = 300 for smart allocation
    if total_amount < 300:
        return AllocatorAnalyzeResponse(
            isSmartMode=False,
            totalAmount=total_amount,
            adviceText="Small amount detected. You may manually allocate this to any pocket."
        )
    
    # Trigger agent
    initial_state = {
        "user_id": x_user_id,
        "total_amount": total_amount,
        "income_sources": sources,
        "messages": [],
        "recommendation": {},
        "advice_text": ""
    }
    
    final_state = allocator_graph.invoke(initial_state)
    
    return AllocatorAnalyzeResponse(
        isSmartMode=True,
        totalAmount=total_amount,
        recommendedAllocation=final_state.get("recommendation"),
        adviceText=final_state.get("advice_text", "Allocation complete.")
    )


@router.post("/confirm", response_model=AllocatorConfirmResponse)
async def confirm_allocation(req: AllocatorConfirmRequest, x_user_id: str = Header("demo_user_01")):
    
    # 1. Get user current data
    user_data = get_user(x_user_id)
    current_balances = user_data.get("financialSections", {})
    
    # 2. Calculate current balance
    new_balances_dict = {}
    for section, current_val in current_balances.items():
        top_up = req.allocationMap.get(section, 0.0)
        new_balances_dict[section] = current_val + top_up
    
    # 3. Dynamically Calculate Runway
    # Emergency Fund + Variable Budget / Average Daily Spending
    total_outflow = user_data.get("totalOutflow", 0.0)
    avg_daily_spending = (total_outflow / 30.0) if total_outflow > 0 else 50.0
    
    available_liquidity = new_balances_dict.get("emergencyFund", 0.0) + new_balances_dict.get("variableBudget", 0.0)
    new_runway_days = round(available_liquidity / avg_daily_spending, 1)

    # 4. Total Up
    total_allocated_amount = sum(req.allocationMap.values())
    new_total_income = user_data.get("totalIncome", 0.0) + total_allocated_amount

    # 5. Update User Collection in DB
    update_user(x_user_id, {
        "financialSections": new_balances_dict,
        "currentRunwayDays": new_runway_days,
        "totalIncome": new_total_income
    })

    # 6. Update Income Injections Status
    from firebase.crud import update_income_injection
    for inj_id in req.injectionIds:
        update_income_injection(x_user_id, inj_id, {
            "status": "allocated",
            "allocatorUsed": True,
            "userFinalAllocation": req.allocationMap,
            "allocatedAt": datetime.now()
        })

    # 7. Update saved amount in Goals  Collection in DB
    savings_to_distribute = req.allocationMap.get("savingsPockets", 0.0)
    
    if savings_to_distribute > 0:
        active_goals = [g for g in get_user_goals(x_user_id) if g.get("savedAmount", 0) < g.get("targetAmount", 0)]
        auto_goal_allocations = calculate_auto_goal_allocations(savings_to_distribute, active_goals)
        
        for goal_id, added_amount in auto_goal_allocations.items():
            original_goal = next((g for g in active_goals if g.get("goalId") == goal_id), None)
            if original_goal:
                new_saved = original_goal.get("savedAmount", 0.0) + added_amount
                update_user_goal(x_user_id, goal_id, {"savedAmount": new_saved})

    return AllocatorConfirmResponse(
        success=True,
        newBalances=FinancialSections(**new_balances_dict),
        runwayRecalc=new_runway_days
    )

##done