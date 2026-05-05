from langchain_google_genai import ChatGoogleGenerativeAI
import os

def get_gemini_llm(temperature: float = 0.2):
    return ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        google_api_key=os.getenv("GOOGLE_API_KEY"),
        temperature=temperature,
        convert_system_message_to_human=True,  # Gemini 需要
    )