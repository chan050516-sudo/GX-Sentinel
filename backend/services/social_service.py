from datetime import datetime
from ..model.models import LeaderboardResponse, LeaderboardEntry, BonusStatusResponse, StreakChallengeResponse, FriendStreak
from ..firebase.crud import get_user

def get_leaderboard_data(user_id: str) -> LeaderboardResponse:
    """
    动态排行榜：1个真实系统用户 + 2个固定分数的好友。
    系统会根据他们的真实分数进行自动排序！
    """
    # 1. 获取系统当前用户的真实分数
    user_data = get_user(user_id) or {}
    real_user_score = user_data.get("resilienceScore", 68.5) # 如果数据库没数据，默认给个 68.5
    
    # 2. 定义真实用户和两个固定好友的数据
    real_user = LeaderboardEntry(anonymizedHandle="@You", resilienceScore=real_user_score, rank=0)
    fixed_friend_1 = LeaderboardEntry(anonymizedHandle="@IronSaver", resilienceScore=92.5, rank=0)
    fixed_friend_2 = LeaderboardEntry(anonymizedHandle="@ZenBudget", resilienceScore=88.1, rank=0)
    
    # 3. 将他们放在一个列表里，并根据分数从高到低排序 (reverse=True)
    competitors = [fixed_friend_1, fixed_friend_2, real_user]
    competitors.sort(key=lambda x: x.resilienceScore, reverse=True)
    
    # 4. 排序完成后，给他们分配最终的排名 (Rank)
    for index, player in enumerate(competitors):
        player.rank = index + 1
        
    return LeaderboardResponse(weekly=competitors, monthly=competitors.copy())

# ----- 下面保留你原有的打卡时刻逻辑 -----
def get_user_bonus_status(user_id: str) -> BonusStatusResponse:
    # ... (保持不变)
    pass

def get_friends_streak_challenge(user_id: str) -> StreakChallengeResponse:
    # ... (保持不变)
    pass