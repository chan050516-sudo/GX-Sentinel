# from typing import TypedDict, Annotated, List, Dict, Any, Literal
# import operator
# import json
# import re
# from langgraph.graph import StateGraph, END
# from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage
# from core.llm import get_gemini_llm
# from .tools import (
#     get_current_runway, 
#     get_variable_balance, 
#     get_active_goals, 
#     get_upcoming_calendar_expenses
# )

# # 1. State Definition
# class AllocatorState(TypedDict):
#     user_id: str
#     total_amount: float
#     income_sources: List[str]   # List from frontend
#     messages: Annotated[List, operator.add]
#     recommendation: Dict[str, Any]
#     advice_text: str

# # 2. Bind Tools
# tools = [get_current_runway, get_variable_balance, get_active_goals, get_upcoming_calendar_expenses]
# llm = get_gemini_llm(temperature=0.1)
# llm_with_tools = llm.bind_tools(tools)

# SYSTEM_PROMPT = """You are a highly analytical AI Financial Allocator.
# The user has received new incoming funds. Your task is to query their financial reality using tools and recommend an allocation strategy.

# CRITICAL RULES:
# 1. CALL TOOLS FIRST: You MUST check their 'runway', 'upcoming calendar expenses', and 'active goals' before making any decision.
# 2. THE CALENDAR RULE: If the tools reveal an upcoming major expense (like Rent, Dentist) within 30 days, you MUST allocate enough funds to 'futureExpenses' to cover it.
# 3. SURVIVAL RULE: If runway < 30 days, prioritize 'emergencyFund'.
# 4. SOURCE SEMANTICS: Adjust your tone and allocation based on where the money came from (e.g., treat "Salary" strictly, but "Bonus" or "Red Packet" can lean slightly towards 'savingsPockets' or 'variableBudget').
# 5. Output MUST be a JSON object assigning exact PERCENTAGES (decimals summing to 1.0) to 5 pockets.

# JSON Schema required in final response:
# {
#   "percentages": {
#     "emergencyFund": 0.0,
#     "fixedExpenses": 0.0,
#     "futureExpenses": 0.0,
#     "variableBudget": 0.0,
#     "savingsPockets": 0.0
#   },
#   "advice": "Explain WHY you chose these percentages based on the tool data (especially mentioning calendar events or specific goals if applicable)."
# }
# """

# # 3. Nodes
# def agent_node(state: AllocatorState):
#     messages = state.get("messages", [])
#     if not messages:
#         sources_str = ", ".join(state["income_sources"])
#         initial_msgs = [
#             SystemMessage(content=SYSTEM_PROMPT),
#             HumanMessage(content=f"I just received a total of RM {state['total_amount']}. Details: {sources_str}. Analyze my situation using your tools and allocate it.")
#         ]
#         response = llm_with_tools.invoke(initial_msgs)
#         return {"messages": initial_msgs + [response]}
#     else:
#         response = llm_with_tools.invoke(messages)
#         return {"messages": [response]}

# def should_continue(state: AllocatorState) -> Literal["tools", "finalize"]:
#     last_message = state["messages"][-1]
#     if hasattr(last_message, "tool_calls") and last_message.tool_calls:
#         return "tools"
#     return "finalize"

# def tools_node(state: AllocatorState):
#     last_message = state["messages"][-1]
#     tool_results = []
#     for tc in last_message.tool_calls:
#         tool_name = tc["name"]
#         tool_args = tc["args"]
#         tool_args["user_id"] = state["user_id"]
        
#         for t in tools:
#             if t.name == tool_name:
#                 result = t.invoke(tool_args)
#                 tool_results.append(ToolMessage(content=str(result), tool_call_id=tc["id"]))
#                 break
#     return {"messages": tool_results}

# def finalize_node(state: AllocatorState):
#     total_amount = state["total_amount"]
#     last_ai = next((m for m in reversed(state["messages"]) if isinstance(m, AIMessage) and not m.tool_calls), None)
    
#     # Default fallback
#     recommendation = {}
#     advice_text = "System fallback: Default allocation applied."
    
#     if last_ai and last_ai.content:
#         try:
#             content = last_ai.content
#             cleaned = re.sub(r"```[a-zA-Z]*", "", content).replace("```", "").strip()
#             data = json.loads(cleaned)
            
#             percents = data.get("percentages", {})
#             advice_text = data.get("advice", "Allocation complete.")
            
#             # Deterministic calculation to prevent LLM hallucination
#             for pocket in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"]:
#                 p = float(percents.get(pocket, 0.2)) 
#                 best_val = total_amount * p
#                 recommendation[pocket] = {
#                     "min": round(best_val * 0.9, 2),
#                     "max": round(best_val * 1.1, 2),
#                     "best": round(best_val, 2)
#                 }
#         except Exception as e:
#             print(f"JSON Parsing Error: {e}")
#             for pocket in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"]:
#                 val = total_amount * 0.2
#                 recommendation[pocket] = {"min": val*0.9, "max": val*1.1, "best": val}

#     return {"recommendation": recommendation, "advice_text": advice_text}

# # 4. Graph Compilation
# workflow = StateGraph(AllocatorState)
# workflow.add_node("agent", agent_node)
# workflow.add_node("tools", tools_node)
# workflow.add_node("finalize", finalize_node)

# workflow.set_entry_point("agent")
# workflow.add_conditional_edges("agent", should_continue)
# workflow.add_edge("tools", "agent")
# workflow.add_edge("finalize", END)

# allocator_graph = workflow.compile()








from typing import TypedDict, Annotated, List, Dict, Any
import operator
import json
import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import HumanMessage, SystemMessage
from core.llm import get_gemini_llm
from firebase.crud import (
    get_user, 
    get_user_goals, 
    get_upcoming_events
)


class AllocatorState(TypedDict):
    user_id: str
    total_amount: float
    income_sources: List[str]
    messages: Annotated[List, operator.add]
    recommendation: Dict[str, Any]
    advice_text: str

llm = get_gemini_llm(temperature=0.1)

SYSTEM_PROMPT = """You are an elite AI Financial Allocator applying Behavioral Economics and modern financial modeling.
The user has received new incoming funds. Your task is to query their financial reality using tools and recommend an allocation strategy.

ECONOMIC MODELS & CRITICAL RULES:
1. CALL TOOLS FIRST: You MUST check their 'runway', 'upcoming calendar expenses', and 'active goals'.
2. MENTAL ACCOUNTING (Windfall vs. Regular): 
   - If the source is 'Salary' or 'Regular', use the 50/30/20 rule as a baseline (50% Fixed/Future, 30% Variable, 20% Savings/Emergency).
   - If the source is 'Prize', 'Bonus', 'Freelance' or 'Unexpected', you MUST apply a "Reward Tax" by allocating at least 15-20% to 'variableBudget'. Never deprive the user of celebrating their hard-earned wins.
3. ZERO-BASED WATERFALL (Priority Routing):
   - Tier 1: Future Obligations. Allocate to 'futureExpenses' to cover upcoming calendar events within 30 days.
   - Tier 2: Survival. If runway < 30 days, funnel aggressively to 'emergencyFund'.
   - Tier 3: Balance. Distribute the remainder between 'savingsPockets' (Goals) and 'variableBudget'.
4. STRICT MATH: Output MUST be a JSON object assigning exact PERCENTAGES (decimals summing to 1.0) to 5 pockets.

JSON Schema required in final response:
{
  "percentages": {
    "emergencyFund": 0.0,
    "fixedExpenses": 0.0,
    "futureExpenses": 0.0,
    "variableBudget": 0.0,
    "savingsPockets": 0.0
  },
  "advice": "Explain your logic using behavioral economics (e.g., mention 'mental accounting', 'rewarding yourself', or 'opportunity cost'). may also relate to the runway, goals and calendar events. After that, give practical financial or investment advices if any."
}
"""

def agent_node(state: AllocatorState):
    user_id = state["user_id"]
    
    user = get_user(user_id) or {}
    runway = user.get("currentRunwayDays", 0.0)
    variable_budget = user.get("financialSections", {}).get("variableBudget", 0.0)
    
    goals = get_user_goals(user_id)
    active_goals = [
        {"title": g.get("title"), "remaining": g.get("targetAmount", 0) - g.get("savedAmount", 0)} 
        for g in goals if g.get("savedAmount", 0) < g.get("targetAmount", 0)
    ]
    
    events = get_upcoming_events(user_id, days=30)
    upcoming_expenses = [
        {"event": e.get("title"), "cost": e.get("estimatedCost")} 
        for e in events
    ]
    
    context_str = f"""
    [USER FINANCIAL REALITY]
    Current Runway: {runway} days
    Current Variable Budget: RM {variable_budget}
    Active Goals: {json.dumps(active_goals)}
    Upcoming Expenses (Next 30 Days): {json.dumps(upcoming_expenses)}
    
    [INCOMING FUNDS]
    Total Amount: RM {state['total_amount']}
    Sources: {", ".join(state['income_sources'])}
    """
    
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Please analyze my reality and allocate the funds.\n{context_str}")
    ]
    
    response = llm.invoke(messages)
    
    return {"messages": [response]}


def finalize_node(state: AllocatorState):
    total_amount = state["total_amount"]
    last_ai = state["messages"][-1]
    
    recommendation = {}
    advice_text = "System fallback: Default allocation applied."
    
    if last_ai and hasattr(last_ai, "content"):
        try:
            content = last_ai.content
            
            if isinstance(content, list):
                content = content[0].get("text", "") if content else ""
            
            cleaned = re.sub(r"```[a-zA-Z]*", "", str(content)).replace("```", "").strip()
            if not cleaned:
                raise ValueError("Empty LLM response content.")
                
            data = json.loads(cleaned)
            
            percents = data.get("percentages", {})
            advice_text = data.get("advice", "Allocation complete.")
            
            total_p = sum(float(percents.get(p, 0)) for p in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"])
            if total_p == 0: 
                total_p = 1.0
            
            for pocket in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"]:
                p = float(percents.get(pocket, 0.2)) / total_p
                best_val = total_amount * p
                recommendation[pocket] = {
                    "min": round(best_val * 0.9, 2),
                    "max": round(best_val * 1.1, 2),
                    "best": round(best_val, 2)
                }
                
        except Exception as e:
            print(f"❌ JSON Parsing Error in Allocator: {e} | Content received: {last_ai.content}")
            for pocket in ["emergencyFund", "fixedExpenses", "futureExpenses", "variableBudget", "savingsPockets"]:
                val = total_amount * 0.2
                recommendation[pocket] = {"min": round(val*0.9, 2), "max": round(val*1.1, 2), "best": round(val, 2)}

    return {"recommendation": recommendation, "advice_text": advice_text}

# 4. Graph Compilation
workflow = StateGraph(AllocatorState)

workflow.add_node("agent", agent_node)
workflow.add_node("finalize", finalize_node)

workflow.set_entry_point("agent")
workflow.add_edge("agent", "finalize")
workflow.add_edge("finalize", END)

allocator_graph = workflow.compile()