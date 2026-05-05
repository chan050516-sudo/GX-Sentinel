# backend/agents/graph_mentor.py
from .state import AgentState
from datetime import datetime

def run_mentor_agent(state: AgentState) -> AgentState:
    
    """
    财务导师 Agent：负责解释财务变动并提供建议。
    """
    user_msg = state.get("user_input", "").lower()
    
    # 模拟 Gemini 的意图识别[cite: 2]
    if "runway" in user_msg:
        state["advice_text"] = (
            "Your runway is the number of days you can survive if all income stops. "
            "Currently, you are at 45.2 days. Focus on reducing 'Variable Budget' "
            "to push this over 60 days[cite: 1, 2]."
        )
    elif "score" in user_msg:
        state["advice_text"] = (
            "Your Resilience Score (68.5) measures your financial discipline. "
            "Avoiding impulse buys today added 2.5 points to your weekly progress[cite: 1, 2]!"
        )
    else:
        state["advice_text"] = "I am GX-Sentinel AI. I help you build financial defense. Ask me about your runway or score[cite: 2]."
        
    return state

