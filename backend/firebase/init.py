import os
from typing import Optional, Dict, Any

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