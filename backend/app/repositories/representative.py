from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.user import RepresentativeProfile, RepresentativeProfileFields
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException
from typing import Optional, List
from datetime import datetime

logger = get_logger(__name__)

class RepresentativeRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create(self, profile: RepresentativeProfile) -> RepresentativeProfile:
        try:
            existing = await self.find_by_email(profile.email)
            if existing:
                raise ValueError("Representative with this email already exists")
            profile_dict = profile.model_dump()
            await self.collection.insert_one(profile_dict)
            logger.info(f"Representative created: {profile.full_name}")
            return profile
        except Exception as e:
            logger.error(f"Error creating representative: {str(e)}")
            raise

    
    async def find_by_user_id(self, user_id: str) -> Optional[RepresentativeProfile]:
        profile_dict = await self.collection.find_one(
            {RepresentativeProfileFields.userId.value: user_id}
        )
        return RepresentativeProfile(**profile_dict) if profile_dict else None

    async def find_by_email(self, email: str) -> Optional[RepresentativeProfile]:
        profile_dict = await self.collection.find_one(
            {RepresentativeProfileFields.email.value: email}
        )
        return RepresentativeProfile(**profile_dict) if profile_dict else None

    # gets ALL representatives belonging to one company. Admin uses this to see their team
    async def find_by_company_id(self, company_id: str) -> List[RepresentativeProfile]:
        cursor = self.collection.find(
            {RepresentativeProfileFields.companyId.value: company_id}
        )
        profiles = await cursor.to_list(length=None)
        return [RepresentativeProfile(**p) for p in profiles]

    async def update(self, user_id: str, update_data: dict) -> RepresentativeProfile:
        result = await self.collection.find_one_and_update(
            {RepresentativeProfileFields.userId.value: user_id},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise NotFoundException(
                message="Representative not found",
                details={"user_id": user_id}
            )
        return RepresentativeProfile(**result)


    # this is called automatically every time a message is processed. 
    # It recalculates the representative's running average quality score. 
    # For example if they handled 5 conversations with average score 70, and new score is 80, it recalculates correctly
    async def update_performance(
        self, user_id: str, new_score: float
    ) -> None:
        representative = await self.find_by_user_id(user_id)
        if not representative:
            raise NotFoundException(
                message="Representative not found",
                details={"user_id": user_id}
            )
        total = representative.total_handled + 1
        avg = (
            (representative.avg_score * representative.total_handled + new_score)
            / total
        )
        await self.collection.update_one(
            {RepresentativeProfileFields.userId.value: user_id},
            {
                "$set": {
                    "total_handled": total,
                    "avg_score": round(avg, 2),
                    "updated_at": datetime.utcnow()
                }
            }
        )

    async def delete(self, user_id: str) -> None:
        await self.collection.delete_one(
            {RepresentativeProfileFields.userId.value: user_id}
        )
        logger.info(f"Representative deleted: {user_id}")