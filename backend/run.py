import uvicorn
import os
import argparse
from dotenv import load_dotenv

load_dotenv()

def start_server(host: str, port: int, reload: bool):
    print("=" * 60)
    print("🚀 GX-Sentinel: Behavioral Finance Guardian AI is starting...")
    print(f"📍 Mode: {'Development (Auto-reload)' if reload else 'Production'}")
    print(f"🔗 URL: http://{host}:{port}")
    print("=" * 60)

    raw_cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if raw_cred_path and not os.path.isabs(raw_cred_path):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        cred_path = os.path.join(base_dir, raw_cred_path)
    else:
        cred_path = raw_cred_path
    if not cred_path or not os.path.exists(cred_path):
        print(f"❌ ERROR: Firebase service account key not found at: {cred_path}")
        print("💡 Please check your .env file and ensure the JSON key exists.")
        return

    uvicorn.run(
        "main:app", 
        host=host, 
        port=port, 
        reload=reload,
        log_level="info"
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run GX-Sentinel Backend")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host address")
    parser.add_argument("--port", type=int, default=8000, help="Port number")
    parser.add_argument("--no-reload", action="store_false", dest="reload", help="Disable auto-reload")
    parser.set_defaults(reload=True)

    args = parser.parse_args()

    start_server(args.host, args.port, args.reload)