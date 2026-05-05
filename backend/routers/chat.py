from fastapi import APIRouter, Header
import uuid
from datetime import datetime
from ..model.models import ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse, WeeklyReportResponse
from ..model.models import ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse, WeeklyReportResponse
# 导入你刚刚写的 Agent 逻辑
from ..agents.graph_mentor import run_mentor_agent

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(req: ChatMessageRequest, x_user_id: str = Header("demo_user_01")):

    # 1. 构造初始状态传给 Agent[cite: 2]
    initial_state = {
        "user_input": req.message,
        "advice_text": ""
    }
    
    # 2. 调用你在 graph_mentor.py 里写的逻辑[cite: 2]
    final_state = run_mentor_agent(initial_state)

    # 队友实现 Mentor Agent
    return ChatMessageResponse(
        reply=f"Stub: You said '{req.message}'. I'm your financial mentor. (AI coming soon)",
        messageId=str(uuid.uuid4()),
    )

@router.get("/history", response_model=ChatHistoryResponse)
async def chat_history(limit: int = 20, before_timestamp: str = None, x_user_id: str = Header("demo_user_01")):
    return ChatHistoryResponse(messages=[])

@router.get("/weekly-report/latest", response_model=WeeklyReportResponse)
async def weekly_report_latest(x_user_id: str = Header("demo_user_01")):
    # 队友实现周报生成
    return WeeklyReportResponse(
        weekStart=datetime.now(),
        summary="Your financial discipline has improved this week![cite: 2]",
        insights={
            "runwayChange": 2.5,
            "impulseCount": 0,
            "topCategory": "Food & Beverage",
            "savingsRate": 0.15
        },
        aiReportText="You're doing great. Keep up the good habits!",
    )