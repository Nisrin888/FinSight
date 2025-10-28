"""
Database Connection for ML Service
Connects to MongoDB to fetch user financial data
"""

from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection string
MONGODB_URI = os.getenv("MONGODB_URI")

# Synchronous MongoDB client (for training models)
def get_db():
    """Get synchronous MongoDB database connection"""
    try:
        client = MongoClient(MONGODB_URI)
        db = client.finsight
        # Test connection
        client.server_info()
        print("[OK] MongoDB connected successfully (sync)")
        return db
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        return None

# Asynchronous MongoDB client (for FastAPI endpoints)
async_client = AsyncIOMotorClient(MONGODB_URI)
async_db = async_client.finsight

async def get_async_db():
    """Get async MongoDB database connection"""
    return async_db

# Test connection on module import
db = get_db()
