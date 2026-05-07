from fastapi import APIRouter, Header
from model.models import LeaderboardResponse, BonusStatusResponse, StreakChallengeResponse
from services import social_service 

router = APIRouter(prefix="/social", tags=["social"])

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(x_user_id: str = Header("demo_user_01")):
    """
    获得混合排行榜：包含 1 个真实用户的数据和 2 个固定好友
    """
    # 将 x_user_id 传给 service 进行动态排序
    return social_service.get_leaderboard_data(x_user_id)

@router.get("/bonus-status", response_model=BonusStatusResponse)
async def bonus_status(x_user_id: str = Header("demo_user_01")):
    return social_service.get_user_bonus_status(x_user_id)

@router.get("/streak-challenge", response_model=StreakChallengeResponse)
async def get_streak_challenge(x_user_id: str = Header("demo_user_01")):
    return social_service.get_friends_streak_challenge(x_user_id)