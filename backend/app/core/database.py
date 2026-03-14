from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.database_init import DatabaseInitializer
from typing import AsyncGenerator
import logging

logger = logging.getLogger(__name__)

class DatabaseConnection:
    def __init__(self):
        self.client = None
        self.db = None

    async def connect(self):
        """Connect to MongoDB and initialize collections."""
        try:
            # Create client
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.MONGODB_DB_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info(f"Successfully connected to MongoDB: {settings.MONGODB_URL}")
            
            # Initialize collections
            await DatabaseInitializer.initialize_collections(self.db)
            
            # Check collection health
            if await DatabaseInitializer.check_collection_health(self.db):
                logger.info("All database collections are healthy and ready")
            else:
                logger.error("Some collections or indexes are missing")
                raise Exception("Database health check failed")
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            self.disconnect()
            raise

    def disconnect(self):
        """Disconnect from MongoDB."""
        if self.client:
            self.client.close()
            self.client = None
            self.db = None
            logger.info("Disconnected from MongoDB")

    async def get_db(self) -> AsyncGenerator[AsyncIOMotorClient, None]:
        """Get database connection as a FastAPI dependency."""
        if not self.db:
            raise Exception("Database connection not initialized")
            
        yield self.db

# Create a singleton instance
database = DatabaseConnection()

async def get_db() -> AsyncGenerator[AsyncIOMotorClient, None]:
    """Get database connection as a FastAPI dependency."""
    if not database.db:
        raise Exception("Database connection not initialized")
    yield database.db
