from fastapi import APIRouter, Header
import uuid
from datetime import datetime
from ..model.models import ManualTransactionRequest, ManualTransactionResponse, UserDashboardResponse , FinancialSections

# 引入数据库接口以实现数据联动
from ..firebase.database import get_user, update_user

router = APIRouter(prefix="/transaction", tags=["transaction"])

@router.post("/manual", response_model=ManualTransactionResponse)
async def manual_transaction(req: ManualTransactionRequest, x_user_id: str = Header("demo_user_01")):
    # 队友实现扣除余额、更新韧性分数
    return ManualTransactionResponse(
        transactionId=str(uuid.uuid4()),
        runwayDrop=5.0,
        resilienceDelta=-2.0,
    )

# --- 新增：Module 3 核心 Dashboard 接口 ---
@router.get("/dashboard", response_model=UserDashboardResponse)
async def get_dashboard(x_user_id: str = Header("demo_user_01")):
    """
    前端 Web Dashboard 启动时调用的第一个接口。
    """

    user_data = get_user(x_user_id)

    # 队友后续会通过 Firebase 获取真实数据并计算
    return UserDashboardResponse(
        # 对应 User Summary 中的核心指标
        runwayDays=user_data.get("currentRunwayDays", 45.2),
        resilienceScore=user_data.get("resilienceScore", 68.5),
        
        # 将数据库字典映射到 FinancialSections 模型
        sectionsBalances=FinancialSections(**user_data["financialSections"]),
        recentTransactions=[] 
    )

