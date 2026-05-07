from fastapi import APIRouter, Header
from ..model.models import (
    LeaderboardResponse, BonusStatusResponse, 
    StreakChallengeResponse, SupportRequest, SupportResponse
)
from ..services import social_service 

router = APIRouter(prefix="/social", tags=["social"])

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(x_user_id: str = Header("demo_user_01")):
    return social_service.get_leaderboard_data(x_user_id)

@router.get("/bonus-status", response_model=BonusStatusResponse)
async def bonus_status(x_user_id: str = Header("demo_user_01")):
    return social_service.get_user_bonus_status(x_user_id)

@router.get("/streak-challenge", response_model=StreakChallengeResponse)
async def get_streak_challenge(x_user_id: str = Header("demo_user_01")):
    return social_service.get_friends_streak_challenge(x_user_id)

# --- 新增的互动接口 ---
@router.post("/support", response_model=SupportResponse)
async def send_support(req: SupportRequest, x_user_id: str = Header("demo_user_01")):
    """
    前端点击 "Send Support" 按钮时调用的接口。
    例如传入主体 JSON: { "targetHandle": "@ZenBudget" }
    """
    return social_service.send_team_support(x_user_id, req.targetHandle)