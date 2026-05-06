from fastapi import APIRouter, Header
from datetime import datetime
from model.models import LeaderboardResponse, LeaderboardEntry, BonusStatusResponse

router = APIRouter(prefix="/social", tags=["social"])

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(x_user_id: str = Header("demo_user_01")):
    return LeaderboardResponse(
        weekly=[LeaderboardEntry(anonymizedHandle="Saver1", resilienceScore=85.2, rank=1)],
        monthly=[LeaderboardEntry(anonymizedHandle="Saver1", resilienceScore=85.2, rank=1)],
    )

@router.get("/bonus-status", response_model=BonusStatusResponse)
async def bonus_status(x_user_id: str = Header("demo_user_01")):
    return BonusStatusResponse(
        bonusPoints=100.0,
        lastBonusDate=datetime.now(),
        nextBonusThreshold="Maintain high score for 7 days",
    )