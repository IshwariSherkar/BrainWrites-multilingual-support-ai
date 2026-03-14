from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.user import CompanyProfile, CompanyProfileFields
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException
from typing import Optional

logger = get_logger(__name__)

class CompanyRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

#  checks if email already exists first, then saves company to MongoDB
    async def create(self, profile: CompanyProfile) -> CompanyProfile:
        try:
            existing = await self.find_by_email(profile.email)
            if existing:
                raise ValueError("Company with this email already exists")
            profile_dict = profile.model_dump()
            await self.collection.insert_one(profile_dict)
            logger.info(f"Company created: {profile.company_name}")
            return profile
        except Exception as e:
            logger.error(f"Error creating company: {str(e)}")
            raise

#   finds company by the admin's UUID
    async def find_by_user_id(self, user_id: str) -> Optional[CompanyProfile]:
        profile_dict = await self.collection.find_one(
            {CompanyProfileFields.userId.value: user_id}
        )
        return CompanyProfile(**profile_dict) if profile_dict else None

# used to check duplicates during registration
    async def find_by_email(self, email: str) -> Optional[CompanyProfile]:
        profile_dict = await self.collection.find_one(
            {CompanyProfileFields.email.value: email}
        )
        return CompanyProfile(**profile_dict) if profile_dict else None

# updates company settings like default tone, output language etc.
    async def update(self, user_id: str, update_data: dict) -> CompanyProfile:
        result = await self.collection.find_one_and_update(
            {CompanyProfileFields.userId.value: user_id},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise NotFoundException(
                message="Company not found",
                details={"user_id": user_id}
            )
        return CompanyProfile(**result)

# removes company from MongoDB
    async def delete(self, user_id: str) -> None:
        await self.collection.delete_one(
            {CompanyProfileFields.userId.value: user_id}
        )
        logger.info(f"Company deleted: {user_id}")

    async def find_by_manager_email(self, email: str) -> Optional[CompanyProfile]:
        profile_dict = await self.collection.find_one(
            {"manager_emails": email}
        )
        return CompanyProfile(**profile_dict) if profile_dict else None

    async def find_by_representative_email(self, email: str) -> Optional[CompanyProfile]:
        profile_dict = await self.collection.find_one(
            {"representative_emails": email}
        )
        return CompanyProfile(**profile_dict) if profile_dict else None
    
    async def find_all(self) -> list:
        cursor = self.collection.find({})
        profiles = []
        async for doc in cursor:
            profiles.append(CompanyProfile(**doc))
        return profiles