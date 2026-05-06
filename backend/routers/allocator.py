from fastapi import APIRouter, Header
import uuid
from model.models import (
    AllocatorAnalyzeRequest, AllocatorAnalyzeResponse,
    AllocatorConfirmRequest, AllocatorConfirmResponse,
    FinancialSections,
)
from agents.graph_allocator import allocator_graph
from firebase.crud import get_user, update_user

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

    # 3. 从数据库获取当前余额并更新
    user_data = get_user(x_user_id)
    current_balances = user_data["financialSections"]
    
    # 根据用户确认的 allocationMap 更新每个分区
    new_balances_dict = {}
    for section, current_val in current_balances.items():
        top_up = req.allocationMap.get(section, 0.0)
        new_balances_dict[section] = current_val + top_up
        
    # 将新余额保存回数据库
    update_user(x_user_id, {"financialSections": new_balances_dict})

    # 队友会实现更新 Firestore
    return AllocatorConfirmResponse(
        success=True,
        newBalances=FinancialSections(**new_balances_dict),
        runwayRecalc=user_data["currentRunwayDays"] + 2.5,
    )


##done