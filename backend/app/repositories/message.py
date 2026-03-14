from motor.motor_asyncio import AsyncIOMotorCollection
from app.models.user import Message
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException
from typing import Optional, List
from datetime import datetime

logger = get_logger(__name__)

class MessageRepository:
    def __init__(self, collection: AsyncIOMotorCollection):
        self.collection = collection

    async def create(self, message: Message) -> Message:
        try:
            message_dict = message.model_dump()
            await self.collection.insert_one(message_dict)
            logger.info(f"Message created: {message.messageId}")
            return message
        except Exception as e:
            logger.error(f"Error creating message: {str(e)}")
            raise

    async def find_by_id(
        self, message_id: str
    ) -> Optional[Message]:
        message_dict = await self.collection.find_one(
            {"messageId": message_id}
        )
        return Message(**message_dict) if message_dict else None

    async def find_by_conversation_id(
        self, conversation_id: str
    ) -> List[Message]:
        cursor = self.collection.find(
            {"conversationId": conversation_id}
        )
        messages = await cursor.to_list(length=None)
        return [Message(**m) for m in messages]

    async def find_by_company_id(
        self, company_id: str
    ) -> List[Message]:
        cursor = self.collection.find(
            {"companyId": company_id}
        )
        messages = await cursor.to_list(length=None)
        return [Message(**m) for m in messages]

    async def find_by_company_and_date(
        self, company_id: str,
        date_start: datetime,
        date_end: datetime
    ) -> List[Message]:
        cursor = self.collection.find({
            "companyId": company_id,
            "created_at": {
                "$gte": date_start,
                "$lt": date_end
            }
        })
        messages = await cursor.to_list(length=None)
        return [Message(**m) for m in messages]

    async def find_worst_by_company_and_date(
        self, company_id: str,
        date_start: datetime,
        date_end: datetime,
        limit: int = 3
    ) -> List[Message]:
        cursor = self.collection.find({
            "companyId": company_id,
            "created_at": {
                "$gte": date_start,
                "$lt": date_end
            }
        }).sort("quality_score", 1).limit(limit)
        messages = await cursor.to_list(length=None)
        return [Message(**m) for m in messages]

    async def approve_recommendation(
        self, message_id: str
    ) -> Message:
        result = await self.collection.find_one_and_update(
            {"messageId": message_id},
            {
                "$set": {
                    "approved": True,
                    "updated_at": datetime.utcnow()
                }
            },
            return_document=True
        )
        if not result:
            raise NotFoundException(
                message="Message not found",
                details={"message_id": message_id}
            )
        return Message(**result)

    async def delete_by_conversation_id(
        self, conversation_id: str
    ) -> None:
        await self.collection.delete_many(
            {"conversationId": conversation_id}
        )
        logger.info(
            f"Messages deleted for conversation: {conversation_id}"
        )