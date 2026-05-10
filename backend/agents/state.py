from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict):
    user_id: str
    amount: float
    current_balances: Dict[str, float]
    user_goals: List[Dict[str, Any]] 
    recommendation: Dict[str, Any]
    advice_text: str 