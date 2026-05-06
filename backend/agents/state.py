# backend/agents/state.py
from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict):
    """
    定义 Agent 的共享状态，所有 Module 的 Agent 都可以引用这个结构。
    """
    user_id: str
    amount: float            # 当前处理的金额 (收入或支出)
    current_balances: Dict[str, float] # 现有的五个分区余额[cite: 1]
    user_goals: List[Dict[str, Any]]   # 用户的储蓄目标[cite: 1]
    recommendation: Dict[str, Any]     # AI 给出的建议结果
    advice_text: str                   # AI 的解释文本[cite: 1]