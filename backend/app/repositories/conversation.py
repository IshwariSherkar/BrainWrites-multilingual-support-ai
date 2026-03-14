from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.user import Conversation
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException
from app.core.enums import ConversationStatus
from typing import Optional, List
from datetime import datetime

logger = get_logger(__name__)

class ConversationRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create(self, conversation: Conversation) -> Conversation:
        try:
            conversation_dict = conversation.model_dump()
            await self.collection.insert_one(conversation_dict)
            logger.info(f"Conversation created: {conversation.conversationId}")
            return conversation
        except Exception as e:
            logger.error(f"Error creating conversation: {str(e)}")
            raise

    async def find_by_id(
        self, conversation_id: str
    ) -> Optional[Conversation]:
        conversation_dict = await self.collection.find_one(
            {"conversationId": conversation_id}
        )
        return Conversation(**conversation_dict) if conversation_dict else None

    # admin uses this to see all conversations across their whole team
    async def find_by_company_id(
        self, company_id: str
    ) -> List[Conversation]:
        cursor = self.collection.find({"companyId": company_id})
        conversations = await cursor.to_list(length=None)
        return [Conversation(**c) for c in conversations]

    # representative uses this to see only their own conversations
    async def find_by_representative_id(
        self, representative_id: str
    ) -> List[Conversation]:
        cursor = self.collection.find(
            {"representativeId": representative_id}
        )
        conversations = await cursor.to_list(length=None)
        return [Conversation(**c) for c in conversations]

    # this is used by the digest service to get yesterday's conversations for the daily email. It filters by company and date range
    async def find_by_company_and_date(
        self, company_id: str, date_start: datetime, date_end: datetime
    ) -> List[Conversation]:
        cursor = self.collection.find({
            "companyId": company_id,
            "created_at": {
                "$gte": date_start,
                "$lt": date_end
            }
        })
        conversations = await cursor.to_list(length=None)
        return [Conversation(**c) for c in conversations]

    # when conversation closes, sets closed_at timestamp and saves the T5 generated summary
    async def update_status(
        self, conversation_id: str, status: ConversationStatus,
        summary: Optional[str] = None
    ) -> Conversation:
        update_data = {
            "status": status.value,
            "updated_at": datetime.utcnow()
        }
        if status == ConversationStatus.CLOSED:
            update_data["closed_at"] = datetime.utcnow()
        if summary:
            update_data["summary"] = summary
        result = await self.collection.find_one_and_update(
            {"conversationId": conversation_id},
            {"$set": update_data},
            return_document=True
        )
        if not result:
            raise NotFoundException(
                message="Conversation not found",
                details={"conversation_id": conversation_id}
            )
        return Conversation(**result)

    # called every time a new message is processed, updates the conversation's running average score
    async def update_quality_score(
        self, conversation_id: str, score: float
    ) -> None:
        await self.collection.update_one(
            {"conversationId": conversation_id},
            {
                "$set": {
                    "quality_score": round(score, 2),
                    "updated_at": datetime.utcnow()
                }
            }
        )

    async def delete(self, conversation_id: str) -> None:
        await self.collection.delete_one(
            {"conversationId": conversation_id}
        )
        logger.info(f"Conversation deleted: {conversation_id}")