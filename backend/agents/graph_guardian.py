from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, Dict, Any
import json
import re
from ..core.llm import get_gemini_llm

# 1. 扁平化状态定义 (去除了复杂的 messages 和 tools)
class GuardianState(TypedDict):
    user_id: str
    product_description: str
    transaction_amount: float
    transaction_time: str
    user_justification: str
    context_data: Dict[str, Any]  # 接收后端传来的绝对事实
    verdict: str
    reasoning: str
    cognitive_message: str
    advice: str

llm = get_gemini_llm(temperature=0.0)

SYSTEM_PROMPT = """You are a highly rational, unyielding financial guardian AI. 
Evaluate if the user's purchase justification is logically sound based on their strict financial reality.

CRITICAL RULES:
1. Ignore emotional pleading. Focus only on math, runway impact, and goals.
2. If time is between 23:00 and 03:00, strongly consider it impulsive.
3. If the purchase consumes >30% of their variable budget or delays a goal, reject it.
4. Output STRICTLY in JSON format.

Expected JSON schema:
{
  "verdict": "valid" or "invalid",
  "reasoning": "Logical breakdown of the decision.",
  "cognitive_message": "A short, sharp, and persuasive message to display to the user.",
  "advice": "Actionable financial advice based on their runway drop and goals. (e.g., 'Save this RM 500 and you will reach your MacBook goal 2 weeks earlier.')"
}
"""

def direct_audit_node(state: GuardianState):
    context = state['context_data']
    goals = context.get('goals', [])
    goals_text = json.dumps(goals, ensure_ascii=False) if goals else "No active goals."
    
    # 将业务事实直接格式化为强上下文，让模型无从反驳
    human_content = f"""
    [TRANSACTION DETAILS]
    Product: {state['product_description']}
    Amount: RM {state['transaction_amount']}
    Time: {state['transaction_time']}

    [FINANCIAL REALITY]
    Current Runway: {context.get('current_runway', 'N/A')} days
    Runway Drop if purchased: -{context.get('runway_drop_days', 'N/A')} days
    Variable Budget Left: RM {context.get('current_variable_balance', 'N/A')}
    Similar items bought this month: {context.get('similar_purchases', 0)}
    Active Goals: {goals_text}

    [USER'S EXCUSE]
    "{state['user_justification']}"
    """
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=human_content)
    ]
    
    response = llm.invoke(messages)
    
    # 鲁棒的 JSON 提取
    try:
        content = response.content
        cleaned_content = re.sub(r"```[a-zA-Z]*", "", content).replace("```", "").strip()
        data = json.loads(cleaned_content)
        
        return {
            "verdict": data.get("verdict", "invalid"),
            "reasoning": data.get("reasoning", "Parsed default reasoning"),
            "cognitive_message": data.get("cognitive_message", "Purchase interception enforced."),
            "advice": data.get("advice", "Focus on maintaining your financial runway.") # <--- 新增提取
        }
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        return {
            "verdict": "invalid",
            "reasoning": "System error parsing justification.",
            "cognitive_message": "Invalid logic structure detected. Please reconsider the purchase.",
            "advice": "Please review your financial goals before proceeding." # <--- 新增
        }

# 构建单节点状态机
workflow = StateGraph(GuardianState)
workflow.add_node("audit", direct_audit_node)
workflow.set_entry_point("audit")
workflow.add_edge("audit", END)

guardian_graph = workflow.compile()