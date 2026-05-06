import os
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional

# Get serviceAccountKey.json path
base_dir = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.join(base_dir, "serviceAccountKey.json")

# Global Firestore Instance
_db: Optional[firestore.Client] = None

def init_firebase():
    global _db
    if not firebase_admin._apps:
        # Check existence of credential
        if not os.path.exists(cred_path):
            raise FileNotFoundError(
                f"Firebase credentials not found at {cred_path}. "
                "Please download serviceAccountKey.json from Firebase Console and place it in backend/firebase/"
            )
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully.")
    _db = firestore.client()
    print("Firestore client ready.")

# Return instance
def get_firestore_client() -> firestore.Client:
    if _db is None:
        init_firebase()
    return _db