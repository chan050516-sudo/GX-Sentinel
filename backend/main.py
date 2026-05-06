from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import allocator, interceptor, chat, social, transaction
from firebase.init import init_firebase

# Pre-load
from services.classifier import classify_necessity
classify_necessity("dummy")

app = FastAPI(title="GX-Sentinel API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

init_firebase()

# app.include_router(user.router)
app.include_router(allocator.router)
app.include_router(interceptor.router)
app.include_router(chat.router)
app.include_router(social.router)
app.include_router(transaction.router)
# app.include_router(calendar.router)

@app.get("/")
async def root():
    return {"message": "GX-Sentinel Backend Running"}