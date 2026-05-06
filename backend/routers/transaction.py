from fastapi import APIRouter, Header
import uuid
from datetime import datetime
from ..model.models import ManualTransactionRequest, ManualTransactionResponse, UserDashboardResponse

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
    # 队友后续会通过 Firebase 获取真实数据并计算
    return UserDashboardResponse(
        runwayDays=45.2,          # 核心 C 位指标：跑道天数
        resilienceScore=68.5,     # 韧性分数
        sectionsBalances={        # 五大分区余额
            "emergencyFund": 1200.0,
            "fixedExpenses": 450.0,
            "futureExpenses": 300.0,
            "variableBudget": 150.0,
            "savingsPockets": 500.0
        },
        recentTransactions=[]     # 最近流水[cite: 1]
    )

