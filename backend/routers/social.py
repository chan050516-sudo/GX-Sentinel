from fastapi import APIRouter, Header
from datetime import datetime
from model.models import LeaderboardResponse, LeaderboardEntry, BonusStatusResponse

# 引入数据库接口以获取真实连续安全天数
from ..firebase.database import get_user

router = APIRouter(prefix="/social", tags=["social"])

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(x_user_id: str = Header("demo_user_01")):
    return LeaderboardResponse(
        weekly=[LeaderboardEntry(anonymizedHandle="Saver1", resilienceScore=85.2, rank=1)],
        monthly=[LeaderboardEntry(anonymizedHandle="Saver1", resilienceScore=85.2, rank=1)],
    )

@router.get("/bonus-status", response_model=BonusStatusResponse)
async def bonus_status(x_user_id: str = Header("demo_user_01")):
    
    # 从数据库读取用户的真实数据
    user_data = get_user(x_user_id)
    safe_days = user_data.get("consecutiveSafeDays", 0) # 获取连续安全天数

    return BonusStatusResponse(
        bonusPoints=100.0,
        lastBonusDate=datetime.now(),
        nextBonusThreshold=f"Safe Streak: {safe_days}/7 days to earn bonus points!"   
        )

