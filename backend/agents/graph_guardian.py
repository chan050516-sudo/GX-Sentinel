from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, Dict, Any
import json
import re
from core.llm import get_gemini_llm

class GuardianState(TypedDict):
    user_id: str
    product_description: str
    transaction_amount: float
    transaction_time: str
    user_justification: str
    context_data: Dict[str, Any]
    verdict: str
    reasoning: str
    cognitive_message: str
    advice: str

llm = get_gemini_llm(temperature=0.0)


SYSTEM_PROMPT = """You are an elite behavioral finance Mentor and Logical Auditor.
Your goal is to rationally evaluate the user's purchase justification. Do NOT be purely aggressive. Be empathetic but firmly grounded in logic and financial reality.
Evaluate the user's purchase excuse using pure logic, but counter them using ADVANCED BEHAVIORAL ECONOMICS.

CRITICAL TACTICS:
1. Intent Alignment (CRITICAL): Check 'Payment Source' and 'Intent Validation Alert'. If they are using a reserved fund (like emergencyFund or fixedExpenses) for an unaligned purchase, politely but firmly point out the discrepancy. Ask if this is a true crisis.
2. Sunk Cost & Streaks: If they have 'Consecutive Safe Days', warn them that this single impulse will DESTROY their hard-earned streak.
3. Consistency Principle: Point out their 'Recent Aborted Item'. Praise their past willpower ("You were strong enough to walk away from the keyboard...") and challenge them to maintain that identity today.
4. Goal Destruction (Loss Aversion): Directly quote the 'Goal Conflict Alert'. Emphasize what percentage of their dream they are sacrificing right now.
5. Output STRICTLY in JSON format without markdown blocks.

Expected JSON schema:
{
  "verdict": "valid" or "invalid",
  "reasoning": "Logical breakdown of why their excuse fails the financial reality check.",
  "cognitive_message": "A highly persuasive, psychological reality check (1-2 sentences). You MUST use the tactical data (streaks, aborted items, or goal conflicts) to pierce their excuse.",
  "advice": "Actionable advice on what to do instead. Tell them exactly how refusing this purchase brings them closer to their goals."
}
"""

def serialize_goal(goal: dict) -> dict:
    """Convert datetime objects to ISO format strings for JSON serialization."""
    serialized = {}
    for key, value in goal.items():
        if hasattr(value, 'isoformat'):
            serialized[key] = value.isoformat()
        else:
            serialized[key] = value
    return serialized


def direct_audit_node(state: GuardianState):
    context = state['context_data']
    goals = context.get('goals', [])
    if goals:
        serializable_goals = [serialize_goal(g) for g in goals]
        goals_text = json.dumps(serializable_goals, ensure_ascii=False)
    else:
        goals_text = "No active goals."
    
    human_content = f"""
    [TRANSACTION DETAILS]
    Product: {state['product_description']}
    Amount: RM {state['transaction_amount']}
    Time: {state['transaction_time']}
    Payment Source Selected: {context.get('payment_source', 'variableBudget')}

    [FINANCIAL REALITY]
    Intent Validation Alert: {context.get('intent_alert', 'None')}
    Current Runway: {context.get('current_runway', 'N/A')} days
    Runway Drop if purchased: -{context.get('runway_drop_days', 'N/A')} days
    Goal Conflict Alert: {context.get('python_conflict_message', 'None')}
    Variable Budget Left: RM {context.get('current_variable_balance', 'N/A')}
    Similar items bought this month: {context.get('similar_purchases', 0)}
    Active Goals: {goals_text}
    Upcoming Events: {context.get('upcoming_events', 'None')}

    [BEHAVIORAL & GAMIFICATION DATA]
    Current Safe Spending Streak: {context.get('consecutive_safe_days', 0)} days
    Current Resilience Score: {context.get('resilience_score', 0)}
    Recent Successful Willpower Test (Aborted Item): {context.get('last_aborted_item', 'None')}

    [USER'S EXCUSE]
    "{state['user_justification']}"
    """
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=human_content)
    ]
    
    response = llm.invoke(messages)

    try:
        content = response.content
        cleaned_content = re.sub(r"```[a-zA-Z]*", "", content).replace("```", "").strip()
        data = json.loads(cleaned_content)
        
        return {
            "verdict": data.get("verdict", "invalid"),
            "reasoning": data.get("reasoning", "Parsed default reasoning"),
            "cognitive_message": data.get("cognitive_message", "Purchase interception enforced."),
            "advice": data.get("advice", "Focus on maintaining your financial runway.")
        }
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return {
            "verdict": "invalid",
            "reasoning": "System error parsing justification.",
            "cognitive_message": "Invalid logic structure detected. Please reconsider the purchase.",
            "advice": "Please review your financial goals before proceeding."
        }

# Single Node State Machine
workflow = StateGraph(GuardianState)
workflow.add_node("audit", direct_audit_node)
workflow.set_entry_point("audit")
workflow.add_edge("audit", END)

guardian_graph = workflow.compile()
