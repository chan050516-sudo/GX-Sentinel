from fastapi import APIRouter, Header
import uuid
from datetime import datetime
from model.models import ManualTransactionRequest, ManualTransactionResponse

router = APIRouter(prefix="/transaction", tags=["transaction"])

@router.post("/manual", response_model=ManualTransactionResponse)
async def manual_transaction(req: ManualTransactionRequest, x_user_id: str = Header("demo_user_01")):
    # 队友实现扣除余额、更新韧性分数
    return ManualTransactionResponse(
        transactionId=str(uuid.uuid4()),
        runwayDrop=5.0,
        resilienceDelta=-2.0,
    )