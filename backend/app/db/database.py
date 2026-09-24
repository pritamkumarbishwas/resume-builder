from motor.motor_asyncio import AsyncIOMotorClient
from urllib.parse import urlparse
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    def connect_db(cls):
        logger.info("Connecting to MongoDB...")
        cls.client = AsyncIOMotorClient(settings.mongo_uri)
        path_db = urlparse(settings.mongo_uri).path.lstrip("/").split("/")[0]
        db_name = path_db if path_db else "resume_builder"
        cls.db = cls.client[db_name]
        logger.info(f"Connected to database: {db_name}")

    @classmethod
    def close_db(cls):
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed.")

db_instance = Database()

async def get_db():
    return db_instance.db
