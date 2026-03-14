from typing import Optional
from motor.motor_asyncio import AsyncIOMotorCollection
from app.core.logging import get_logger
from app.models.user import AuthUser
from app.core.exceptions import DuplicateRequestException, NotFoundException
from app.schemas.auth import AuthProfileUpdate
from app.models.user import AuthProfile
logger = get_logger(__name__)

class AuthRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection
        logger.info("AuthRepository initialized", collection=str(collection.full_name))

    async def create(self, user: AuthUser) -> AuthUser:
        logger.info("Creating new user", email=user.email)
        try:
            # Convert user to dict and ensure all required fields are present
            user_dict = user.model_dump()  # Use model_dump to exclude None values
            
            # Ensure we have all required fields
            required_fields = ['email', 'hashed_password', 'entity_type']
            missing_fields = [f for f in required_fields if f not in user_dict]
            if missing_fields:
                raise ValueError(f"Missing required fields: {', '.join(missing_fields)}")
            
            await self.collection.insert_one(user_dict)
            logger.info("User created successfully", user_id=user.userId)
            return user
        except Exception as e:
            logger.error("Failed to create user", error=str(e))
            raise DuplicateRequestException(f"Failed to create user: {str(e)}")

    async def find_by_email(self, email: str) -> Optional[AuthUser]:
        logger.info("Finding user by email", email=email)
        user_dict = await self.collection.find_one({"email": email})
        if user_dict:
            logger.info("User found", user_id=user_dict["userId"])
            return AuthUser(**user_dict)
        logger.info("User not found", email=email)
        return None

    async def find_by_user_id(self, user_id: str) -> Optional[AuthUser]:
        logger.info("Finding user by ID", user_id=user_id)
        user_dict = await self.collection.find_one({"userId": user_id})
        if user_dict:
            logger.info("User found", user_id=user_dict["userId"])
            return AuthUser(**user_dict)
        logger.info("User not found", user_id=user_id)
        return None
    
    async def delete_by_user_id(self, user_id: str) -> None:
        logger.info("Deleting user by ID", user_id=user_id)
        result = await self.collection.delete_one({"userId": user_id})
        if result.deleted_count == 0:
            raise NotFoundException(message="User not found", details={"user_id": user_id})
        else:
            logger.info("User deleted successfully", user_id=user_id)

    async def update(self, user_id: str, data: AuthProfileUpdate) -> AuthProfile:
        update_data = data.dict_not_none()
        result = await self.collection.find_one_and_update(
            {"userId": user_id},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise NotFoundException(f"Candidate profile with userId {user_id} not found")
        return AuthProfile(**result)