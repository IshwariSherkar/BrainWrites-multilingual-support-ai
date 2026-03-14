from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.user import Digest
from app.core.logging import get_logger
from app.core.enums import DigestTrigger
from typing import Optional, List
from datetime import datetime

logger = get_logger(__name__)

class DigestRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create(self, digest: Digest) -> Digest:
        try:
            digest_dict = digest.model_dump()
            await self.collection.insert_one(digest_dict)
            logger.info(
                f"Digest saved: {digest.digestId} "
                f"for company: {digest.companyId}"
            )
            return digest
        except Exception as e:
            logger.error(f"Error saving digest: {str(e)}")
            raise

    async def find_by_company_id(
        self, company_id: str
    ) -> List[Digest]:
        cursor = self.collection.find(
            {"companyId": company_id}
        ).sort("created_at", -1)
        digests = await cursor.to_list(length=None)
        return [Digest(**d) for d in digests]

    async def find_latest_by_company(
        self, company_id: str
    ) -> Optional[Digest]:
        digest_dict = await self.collection.find_one(
            {"companyId": company_id},
            sort=[("created_at", -1)]
        )
        return Digest(**digest_dict) if digest_dict else None

    async def find_by_trigger(
        self, company_id: str,
        trigger: DigestTrigger
    ) -> List[Digest]:
        cursor = self.collection.find({
            "companyId": company_id,
            "trigger": trigger.value
        }).sort("created_at", -1)
        digests = await cursor.to_list(length=None)
        return [Digest(**d) for d in digests]

    async def count_by_company(
        self, company_id: str
    ) -> int:
        return await self.collection.count_documents(
            {"companyId": company_id}
        )