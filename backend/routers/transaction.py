from fastapi import APIRouter, Header
from ..model.models import ManualTransactionRequest, ManualTransactionResponse, UserDashboardResponse

# 引入刚刚写好的 service
from ..services import transaction_service

router = APIRouter(prefix="/transaction", tags=["transaction"])

@router.post("/manual", response_model=ManualTransactionResponse)
async def manual_transaction(req: ManualTransactionRequest, x_user_id: str = Header("demo_user_01")):
    """
    前端调用此接口模拟用户花钱，触发 Real-time Micro-Nudge。
    具体逻辑已交由 Service 层处理。
    """
    # 将前端传来的用户 ID 和消费金额，交给 service 处理
    return transaction_service.process_manual_transaction(x_user_id, req.amount)


# --- Module 3 核心 Dashboard 接口 ---
@router.get("/dashboard", response_model=UserDashboardResponse)
async def get_dashboard(x_user_id: str = Header("demo_user_01")):
    """
    前端 Web Dashboard 启动时调用的第一个接口。
    获取最新的核心指标和账户余额。
    """
    # 直接调用 service 获取打包好的 Dashboard 数据
    return transaction_service.get_user_dashboard_data(x_user_id)