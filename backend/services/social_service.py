from datetime import datetime
from ..model.models import (
    LeaderboardResponse, LeaderboardEntry, BonusStatusResponse, 
    StreakChallengeResponse, FriendStreak, SupportResponse
)
# 注意：确保引入了 update_user 以便我们保存支持记录
from ..firebase.crud import get_user, update_user

def get_leaderboard_data(user_id: str) -> LeaderboardResponse:
    #ranking
    """团队健康度名册 (基于你的 Co-op 逻辑)"""
    user_data = get_user(user_id) or {}
    real_user_score = user_data.get("resilienceScore", 85.0) 
    
    team_member_1 = LeaderboardEntry(anonymizedHandle="@IronSaver", resilienceScore=92.5, rank=0)
    team_member_2 = LeaderboardEntry(anonymizedHandle="@ZenBudget", resilienceScore=82.0, rank=0) 
    real_user = LeaderboardEntry(anonymizedHandle="@You", resilienceScore=real_user_score, rank=0)
    
    team = [team_member_1, team_member_2, real_user]
    team.sort(key=lambda x: x.resilienceScore, reverse=True)
    
    for index, player in enumerate(team):
        player.rank = index + 1
        
    return LeaderboardResponse(weekly=team, monthly=team.copy())


def get_user_bonus_status(user_id: str) -> BonusStatusResponse:
    #To determine is the team streak succces or not
    """右上角的团队概览面板 (基于你的失败/警告/胜利判定)"""
    user_data = get_user(user_id) or {}
    user_score = user_data.get("resilienceScore", 85.0) 
    team_streak = user_data.get("consecutiveSafeDays", 5) 

    tm1_score = 92.5
    tm2_score = 82.0 

    if user_score < 80.0 or tm1_score < 80.0 or tm2_score < 80.0:
        msg = "❌ Team Challenge Failed! Someone's score dropped below 80."
    elif team_streak >= 7:
        msg = "🎉 7-Day Team Goal Achieved! Weekly Co-op Bonus Unlocked!"
    elif user_score < 83.0 or tm2_score < 83.0:
        struggling_member = "@You" if user_score < 83.0 else "@ZenBudget"
        msg = f"Team Streak: {team_streak}/7 Days. ⚠️ {struggling_member} is below 83 pts! Send support!"
    else:
        msg = f"🛡️ Team Streak: {team_streak}/7 Days. Keep all scores > 80!"

    return BonusStatusResponse(
        bonusPoints=300.0, 
        lastBonusDate=datetime.now(),
        nextBonusThreshold=msg
    )


def send_team_support(user_id: str, target_handle: str) -> SupportResponse:
    #Support teammate 
    """
    [新增功能]：处理前端发送鼓励的动作，并将记录保存到数据库中。
    """
    user_data = get_user(user_id) or {}
    supported_list = user_data.get("sentSupportTo", [])
    
    # 如果还没鼓励过这个人，就把他加入名单并更新数据库
    if target_handle not in supported_list:
        supported_list.append(target_handle)
        update_user(user_id, {"sentSupportTo": supported_list})
        
    return SupportResponse(message=f"Support successfully sent to {target_handle}!", success=True)


def get_friends_streak_challenge(user_id: str) -> StreakChallengeResponse:
    """核心小队打卡面板 (整合了你的合作逻辑 与 鼓励文字变化逻辑)"""
    user_data = get_user(user_id) or {}
    user_score = user_data.get("resilienceScore", 85.0) 
    base_streak = user_data.get("consecutiveSafeDays", 5) 
    # [新增]：读取当前用户已经鼓励过的人员名单
    supported_list = user_data.get("sentSupportTo", [])

    tm1_score = 92.5
    tm2_score = 82.0 

    team_failed = user_score < 80.0 or tm1_score < 80.0 or tm2_score < 80.0
    effective_streak = 0 if team_failed else base_streak

    warnings = []
    if 80.0 <= user_score < 83.0: warnings.append("You")
    if 80.0 <= tm1_score < 83.0: warnings.append("@IronSaver")
    if 80.0 <= tm2_score < 83.0: warnings.append("@ZenBudget")

    warning_text = ""
    if warnings:
        warning_text = f" | ⚠️ {' & '.join(warnings)} need support! (<83)"

    if team_failed:
        challenge_title = "❌ Weekly Co-op Failed (Score < 80)"
    elif effective_streak >= 7:
        challenge_title = "🏆 Weekly Co-op Defense: Victory!"
    else:
        challenge_title = f"🛡️ Co-op Team Defense (Day {effective_streak}/7){warning_text}"

    # --- 决定 @ZenBudget 的状态文字 (整合互动反馈) ---
    if team_failed:
        tm2_status = "Failed 💔"
    elif tm2_score < 83.0:
        # 如果已经点击过鼓励了，文字变成成功
        if "@ZenBudget" in supported_list:
            tm2_status = "Support Sent ✅" 
        else:
            tm2_status = "Needs Encouragement! 🆘"
    else:
        tm2_status = "Safe"

    current_user_obj = FriendStreak(
        name="@You",
        resilienceScore=user_score,
        currentStreak=effective_streak,
        rewardStatus="Failed 💔" if team_failed else "Keep going!",
        isEligible=user_score >= 80.0
    )

    tm1_obj = FriendStreak(
        name="@IronSaver",
        resilienceScore=tm1_score,
        currentStreak=effective_streak,
        rewardStatus="Safe" if not team_failed else "Failed 💔",
        isEligible=tm1_score >= 80.0
    )

    tm2_obj = FriendStreak(
        name="@ZenBudget",
        resilienceScore=tm2_score,
        currentStreak=effective_streak,
        rewardStatus=tm2_status, # 这里使用了上面的动态文字
        isEligible=tm2_score >= 80.0
    )

    return StreakChallengeResponse(
        challengeTitle=challenge_title,
        currentUser=current_user_obj,
        friends=[tm1_obj, tm2_obj]
    )