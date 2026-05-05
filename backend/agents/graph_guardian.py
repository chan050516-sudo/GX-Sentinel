# backend/agents/graph_guardian.py
import random
from typing import TypedDict

# 为了保持架构完整性，我们依然保留 State 定义
class GraphState(TypedDict):
    justification: str
    is_night_time: bool
    result: dict

def run_guardian_agent(justification: str, is_night_time: bool) -> dict:
    """
    模拟 LangGraph Agent 的执行结果。
    通过随机逻辑或关键词匹配，让演示看起来非常智能。
    """
    
    # 逻辑 1：如果是深夜，极高概率判定为 invalid
    if is_night_time:
        return {
            "verdict": "invalid",
            "reasoning": "System detected high emotional volatility due to late-night hours (23:00-03:00).",
            "cognitiveMessage": "Is this a late-night dopamine hit, or a real need? Sleep on it."
        }
    
    # 逻辑 2：简单的关键词拦截
    triggers = ["want", "please", "buy", "game", "gift"]
    if any(word in justification.lower() for word in triggers):
        return {
            "verdict": "invalid",
            "reasoning": "The justification leans towards emotional desire rather than functional necessity.",
            "cognitiveMessage": "Your future self will thank you for not buying this today."
        }

    # 逻辑 3：默认通过
    return {
        "verdict": "valid",
        "reasoning": "Justification accepted based on current financial runway and necessity.",
        "cognitiveMessage": "Purchase authorized. Keep staying mindful of your goals."
    }