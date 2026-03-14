from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

class DatabaseInitializer:
    REQUIRED_COLLECTIONS = [
        "users",  # For auth_users collection
        "candidates",  # For candidate profiles
        "admin",
    ]

    @staticmethod
    async def initialize_collections(db: AsyncIOMotorDatabase) -> None:
        """Initialize all required collections with appropriate indexes."""
        existing_collections = await db.list_collection_names()
        
        for collection_name in DatabaseInitializer.REQUIRED_COLLECTIONS:
            if collection_name not in existing_collections:
                await db.create_collection(collection_name)
                print(f"Created collection: {collection_name}")
            
            # Add indexes for each collection
            await DatabaseInitializer._create_indexes(db, collection_name)

    @staticmethod
    async def _create_indexes(db: AsyncIOMotorDatabase, collection_name: str) -> None:
        """Create indexes for each collection."""
        collection = db[collection_name]
        
        if collection_name == "users":
            # Create unique index on userId and email for users collection
            await collection.create_index("userId", unique=True)
            await collection.create_index("email", unique=True)
        elif collection_name == "candidates":
            # Create indexes for candidates collection
            await collection.create_index("userId", unique=True)
            await collection.create_index("email")
        elif collection_name == "admin":
            # Create indexes for admin collection
            await collection.create_index("userId", unique=True)
            await collection.create_index("email")


    @staticmethod
    async def check_collection_health(db: AsyncIOMotorDatabase) -> bool:
        """Check if all required collections exist and have proper indexes."""
        existing_collections = await db.list_collection_names()
        
        for collection_name in DatabaseInitializer.REQUIRED_COLLECTIONS:
            if collection_name not in existing_collections:
                print(f"Warning: Collection {collection_name} is missing")
                return False
                
            collection = db[collection_name]
            indexes = await collection.index_information()
            
            if collection_name == "users":
                required_indexes = ["userId_1", "email_1"]
            else:
                required_indexes = ["userId_1"]
                
            for index_name in required_indexes:
                if index_name not in indexes:
                    print(f"Warning: Missing index {index_name} in {collection_name}")
                    return False
        
        return True
