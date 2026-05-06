from fastapi import APIRouter, Header
import uuid
from ..model.models import (
    AllocatorAnalyzeRequest, AllocatorAnalyzeResponse,
    AllocatorConfirmRequest, AllocatorConfirmResponse,
    FinancialSections,
)

# 1. 导入你的 AI Agent 和数据库操作
from ..agents.graph_allocator import run_allocator_agent
from ..firebase.database import get_user, update_user

router = APIRouter(prefix="/allocator", tags=["allocator"])

@router.post("/analyze", response_model=AllocatorAnalyzeResponse)
async def analyze_allocation(req: AllocatorAnalyzeRequest, x_user_id: str = Header("demo_user_01")):

    # 2. 构造 Agent 状态并调用 AI 逻辑
    initial_state = {
        "user_id": x_user_id,
        "amount": req.amount,
        "recommendation": {},
        "advice_text": ""
    }
    
    # 运行你在 graph_allocator.py 中定义的算法
    final_state = run_allocator_agent(initial_state)

    # 队友会实现 get_allocation_recommendation
    # 目前提供 fallback
    return AllocatorAnalyzeResponse(
        recommendedAllocation=final_state["recommendation"], 
        adviceText=final_state["advice_text"],
        investmentSuggestion="Consider a low-risk fund for your emergency savings."
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