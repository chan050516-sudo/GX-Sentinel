from fastapi import APIRouter, Header
from model.models import ManualTransactionRequest, ManualTransactionResponse, UserDashboardResponse

from services import transaction_service

router = APIRouter(prefix="/transaction", tags=["transaction"])

@router.post("/manual", response_model=ManualTransactionResponse)
async def manual_transaction(req: ManualTransactionRequest, x_user_id: str = Header("demo_user_01")):
    return transaction_service.process_manual_transaction(x_user_id, req.amount)


@router.get("/dashboard", response_model=UserDashboardResponse)
async def get_dashboard(x_user_id: str = Header("demo_user_01")):
    return transaction_service.get_user_dashboard_data(x_user_id)