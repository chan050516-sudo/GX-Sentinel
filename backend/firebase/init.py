import os
from typing import Optional, Dict, Any
import firebase_admin
from firebase_admin import credentials, firestore
import os

base_dir = os.path.dirname(os.path.abspath(__file__))
cred_path = os.path.join(base_dir, "serviceAccountKey.json")

# Initialize app
if not firebase_admin._apps:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
db = firestore.client()

# Later update
_firestore_client = None

def init_firebase():
    global _firestore_client
    # TODO: 实际初始化
    print("Firebase init stub (replace with real init)")
    _firestore_client = {}

def get_firestore_client():
    """返回 Firestore 客户端（空壳）"""
    return _firestore_client