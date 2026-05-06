from fastapi import APIRouter, Header
import uuid
import datetime
from model.models import ChatMessageRequest, ChatMessageResponse, ChatHistoryResponse, WeeklyReportResponse

router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/message", response_model=ChatMessageResponse)
async def chat_message(req: ChatMessageRequest, x_user_id: str = Header("demo_user_01")):
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
        summary="Stub weekly report",
        insights={},
        aiReportText="You're doing great. Keep up the good habits!",
    )