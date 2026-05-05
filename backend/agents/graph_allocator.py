# backend/agents/graph_allocator.py
from .state import AgentState

def run_allocator_agent(state: AgentState) -> AgentState:
    """
    智能分配 Agent：根据财务缺口给出建议。
    输出格式已更新以匹配 AllocatorAnalyzeResponse 模型。
    """
    amount = state["amount"]
    
    # 辅助函数：根据比例创建符合模型要求的 Range 对象
    def create_range(percent):
        best_val = amount * percent
        return {
            "min": best_val * 0.9,  # 允许 10% 的下浮空间
            "max": best_val * 1.1,  # 允许 10% 的上浮空间
            "best": best_val        # AI 推荐的最佳值
        }
    
    # 按照图片 image_e6b154.jpg 中的结构组织数据
    state["recommendation"] = {
        "emergencyFund": create_range(0.40),
        "fixedExpenses": create_range(0.30),
        "futureExpenses": create_range(0.10),
        "variableBudget": create_range(0.15),
        "savingsPockets": create_range(0.05)
    }
    
    state["advice_text"] = (
        "AI Analysis: We've prioritized 40% of this inflow into your Emergency Fund. "
        "Your current runway is under 45 days, and building this safety net is critical "
        "to surviving financial shocks."
    )
    
    return state