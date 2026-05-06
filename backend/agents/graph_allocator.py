from typing import TypedDict, Annotated, List, Dict, Any, Literal
import operator
import json
import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
from core.llm import get_gemini_llm
from tools import (
    get_current_runway, 
    get_variable_balance, 
    get_active_goals, 
    get_upcoming_calendar_expenses
)

# 1. State Definition
class AllocatorState(TypedDict):
    user_id: str
    total_amount: float
    income_sources: List[str]   # List from frontend
    messages: Annotated[List, operator.add]
    recommendation: Dict[str, Any]
    advice_text: str

# 2. Bind Tools
tools = [get_current_runway, get_variable_balance, get_active_goals, get_upcoming_calendar_expenses]
llm = get_gemini_llm(temperature=0.1)
llm_with_tools = llm.bind_tools(tools)

SYSTEM_PROMPT = """You are a highly analytical AI Financial Allocator.
The user has received new incoming funds. Your task is to query their financial reality using tools and recommend an allocation strategy.

CRITICAL RULES:
1. CALL TOOLS FIRST: You MUST check their 'runway', 'upcoming calendar expenses', and 'active goals' before making any decision.
2. THE CALENDAR RULE: If the tools reveal an upcoming major expense (like Rent, Dentist) within 30 days, you MUST allocate enough funds to 'futureExpenses' to cover it.
3. SURVIVAL RULE: If runway < 30 days, prioritize 'emergencyFund'.
4. SOURCE SEMANTICS: Adjust your tone and allocation based on where the money came from (e.g., treat "Salary" strictly, but "Bonus" or "Red Packet" can lean slightly towards 'savingsPockets' or 'variableBudget').
5. Output MUST be a JSON object assigning exact PERCENTAGES (decimals summing to 1.0) to 5 pockets.

JSON Schema required in final response:
{
  "percentages": {
    "emergencyFund": 0.0,
    "fixedExpenses": 0.0,
    "futureExpenses": 0.0,
    "variableBudget": 0.0,
    "savingsPockets": 0.0
  },
  "advice": "Explain WHY you chose these percentages based on the tool data (especially mentioning calendar events or specific goals if applicable)."
}
"""

# 3. Nodes
def agent_node(state: AllocatorState):
    messages = state.get("messages", [])
    if not messages:
        sources_str = ", ".join(state["income_sources"])
        initial_msgs = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=f"I just received a total of RM {state['total_amount']}. Details: {sources_str}. Analyze my situation using your tools and allocate it.")
        ]
        response = llm_with_tools.invoke(initial_msgs)
        return {"messages": initial_msgs + [response]}
    else:
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}

def should_continue(state: AllocatorState) -> Literal["tools", "finalize"]:
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return "finalize"

def tools_node(state: AllocatorState):
    last_message = state["messages"][-1]
    tool_results = []
    for tc in last_message.tool_calls:
        tool_name = tc["name"]
        tool_args = tc["args"]
        tool_args["user_id"] = state["user_id"]
        
        for t in tools:
            if t.name == tool_name:
                result = t.invoke(tool_args)
                tool_results.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
                break
    return {"messages": tool_results}

def finalize_node(state: AllocatorState):
    total_amount = state["total_amount"]
    last_ai = next((m for m in reversed(state["messages"]) if isinstance(m, AIMessage) and not m.tool_calls), None)
    
    # 默认兜底结构
    recommendation = {}
    advice_text = "System fallback: Default allocation applied."
    
    if last_ai and last_ai.content:
        try:
            content = last_ai.content
            cleaned = re.sub(r"```[a-zA-Z]*", "", content).replace("```", "").strip()
            data = json.loads(cleaned)
            
            percents = data.get("percentages", {})
            advice_text = data.get("advice", "Allocation complete.")
            
            # 安全计算：通过 Python 将百分比转化为绝对金额与上下限 (防御 AI 数学幻觉)
            for pocket in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"]:
                p = float(percents.get(pocket, 0.2)) 
                best_val = total_amount * p
                recommendation[pocket] = {
                    "min": round(best_val * 0.9, 2),
                    "max": round(best_val * 1.1, 2),
                    "best": round(best_val, 2)
                }
        except Exception as e:
            print(f"JSON Parsing Error: {e}")
            for pocket in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"]:
                val = total_amount * 0.2
                recommendation[pocket] = {"min": val*0.9, "max": val*1.1, "best": val}

    return {"recommendation": recommendation, "advice_text": advice_text}

# 4. Graph Compilation
workflow = StateGraph(AllocatorState)
workflow.add_node("agent", agent_node)
workflow.add_node("tools", tools_node)
workflow.add_node("finalize", finalize_node)

workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue)
workflow.add_edge("tools", "agent")
workflow.add_edge("finalize", END)

allocator_graph = workflow.compile()