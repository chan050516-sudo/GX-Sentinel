from fastapi import APIRouter, Header
import uuid
from ..model.models import (
    AllocatorAnalyzeRequest, AllocatorAnalyzeResponse,
    AllocatorConfirmRequest, AllocatorConfirmResponse,
    FinancialSections,
)

router = APIRouter(prefix="/allocator", tags=["allocator"])

@router.post("/analyze", response_model=AllocatorAnalyzeResponse)
async def analyze_allocation(req: AllocatorAnalyzeRequest, x_user_id: str = Header("demo_user_01")):
    # 队友会实现 get_allocation_recommendation
    # 目前提供 fallback
    return AllocatorAnalyzeResponse(
        recommendedAllocation={
            "emergencyFund": {"min": 0, "max": req.amount, "best": req.amount * 0.2},
            "fixedExpenses": {"min": 0, "max": req.amount, "best": req.amount * 0.2},
            "futureExpenses": {"min": 0, "max": req.amount, "best": req.amount * 0.2},
            "variableBudget": {"min": 0, "max": req.amount, "best": req.amount * 0.2},
            "savingsPockets": {"min": 0, "max": req.amount, "best": req.amount * 0.2},
        },
        adviceText="This is a stub advice. Replace with AI.",
        investmentSuggestion="Consider a low-risk fund.",
    )

@router.post("/confirm", response_model=AllocatorConfirmResponse)
async def confirm_allocation(req: AllocatorConfirmRequest, x_user_id: str = Header("demo_user_01")):
    # 队友会实现更新 Firestore
    return AllocatorConfirmResponse(
        success=True,
        newBalances=FinancialSections(**req.allocationMap),
        runwayRecalc=45.0,
    )