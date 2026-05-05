from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from typing import TypedDict, Annotated, List, Literal
import operator
import json
from ..core.llm import get_gemini_llm
from .tools import (
    get_current_runway, get_variable_balance, get_active_goals,
    get_similar_purchases, calculate_runway_impact
)

# 定义状态
class GuardianState(TypedDict):
    user_id: str
    product_description: str
    transaction_amount: float
    transaction_time: str
    user_justification: str
    messages: Annotated[List, operator.add]   # 对话历史
    verdict: str
    reasoning: str
    cognitive_message: str

# 绑定工具
tools = [
    get_current_runway, get_variable_balance, get_active_goals,
    get_similar_purchases, calculate_runway_impact
]
llm = get_gemini_llm(temperature=0.2)
llm_with_tools = llm.bind_tools(tools)

# 系统提示
SYSTEM_PROMPT = """You are a financial guardian agent. You have tools to fetch the user's financial data.
Your task: Evaluate whether the purchase justification is rational. Follow these steps:

1. **Gather necessary data** using the available tools. You MUST at least get:
   - current runway
   - variable balance
   - active goals
   - similar purchases count (call with product_keyword = the product description)
   - runway impact of this transaction

2. **Analyze** based on the following rules:
   - If transaction time is between 23:00 and 03:00, strongly consider as impulsive.
   - If justification is weak (e.g., "I want it", "just because", "to feel good"), lean towards invalid.
   - If the purchase would consume >30% of remaining variable budget, consider invalid.
   - If it conflicts with any active goal (especially high priority), consider invalid.

3. **Decide** verdict: "valid" (rational purchase) or "invalid" (impulsive).

4. **Output** a JSON with the following structure:
{
  "verdict": "valid" or "invalid",
  "reasoning": "detailed explanation for your decision",
  "cognitive_message": "short, persuasive message to show to the user to discourage the purchase (if invalid) or encourage (if valid)"
}

Always output only the JSON, no other text.
"""

def agent_node(state: GuardianState):
    messages = state.get("messages", [])
    if not messages:
        # Generate basic prompt in first entry
        initial_messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"Product: {state['product_description']}...")
        ]
        response = llm_with_tools.invoke(initial_messages)
        # First time return all initial message and AI response
        return {"messages": initial_messages + [response]}
    else:
        # Subsequent iteration use current state to trigger LLM
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

def should_continue(state: GuardianState) -> Literal["tools", "finalize"]:
    """判断是否需要继续调用工具"""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "finalize"

def tools_node(state: GuardianState):
    """执行工具调用并返回结果"""
    last_message = state["messages"][-1]
    tool_results = []
    for tc in last_message.tool_calls:
        tool_name = tc["name"]
        tool_args = tc["args"]
        # 自动注入 user_id（如果工具需要且未提供）
        if "user_id" in tool_args or "user_id" in [p.name for p in tools if p.name == tool_name]:
            # 某些工具可能需要 user_id，如果没有传递则自动补上
            if "user_id" not in tool_args:
                tool_args["user_id"] = state["user_id"]
        # 查找对应工具
        for tool in tools:
            if tool.name == tool_name:
                result = tool.invoke(tool_args)
                tool_results.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
                break
    # 将工具结果添加到历史
    updated_messages = state["messages"] + tool_results
    return {"messages": updated_messages}

def finalize_node(state: GuardianState):
    """聚合所有信息，生成最终裁决"""
    last_ai = next((m for m in reversed(state["messages"]) if isinstance(m, AIMessage) and not m.tool_calls), None)
    if last_ai and last_ai.content:
        try:
            content = last_ai.content
            # 提取 JSON 内容
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            data = json.loads(content)
            return {
                "verdict": data.get("verdict", "invalid"),
                "reasoning": data.get("reasoning", ""),
                "cognitive_message": data.get("cognitive_message", "Please reconsider.")
            }
        except Exception as e:
            print(f"Error parsing AI response: {e}")
            pass
    return {
        "verdict": "invalid",
        "reasoning": "System unable to evaluate, default to invalid.",
        "cognitive_message": "We couldn't verify your justification. Please reconsider the purchase."
    }

def build_guardian_graph():
    workflow = StateGraph(GuardianState)
    workflow.add_node("agent", agent_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("finalize", finalize_node)
    
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", "finalize": "finalize"})
    workflow.add_edge("tools", "agent")
    workflow.add_edge("finalize", END)
    
    return workflow.compile()

# 全局编译 graph（避免重复编译）
guardian_graph = build_guardian_graph()