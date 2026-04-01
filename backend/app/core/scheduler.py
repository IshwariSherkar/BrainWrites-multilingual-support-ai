from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    hour, minute = settings.DIGEST_TIME.split(":")

    # ── Daily digest job ──
    scheduler.add_job(
        _send_all_digests,
        trigger=CronTrigger(hour=int(hour), minute=int(minute)),
        id="daily_digest",
        replace_existing=True
    )

    # ── Auto-close conversations older than 24hrs (runs every hour) ──
    scheduler.add_job(
        _auto_close_old_conversations,
        trigger=IntervalTrigger(hours=1),
        id="auto_close_conversations",
        replace_existing=True
    )

    scheduler.start()
    logger.info(
        f"Scheduler started - digest at {settings.DIGEST_TIME}"
    )


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped")


async def _send_all_digests():
    from app.api.deps import dependency_storage
    from app.core.enums import DigestTrigger

    logger.info("Running scheduled daily digest")

    if dependency_storage is None:
        logger.error("Dependencies not initialized")
        return

    digest_service = dependency_storage.get_digest_service()
    company_repo = dependency_storage.get_company_repository()

    try:
        cursor = company_repo.collection.find(
            {"digest_enabled": True}
        )
        companies = await cursor.to_list(length=None)

        for company in companies:
            try:
                await digest_service.send_digest(
                    company_id=company["userId"],
                    admin_id=company["userId"],
                    trigger=DigestTrigger.SCHEDULED
                )
                logger.info(
                    f"Digest sent for: {company['company_name']}"
                )
            except Exception as e:
                logger.error(
                    f"Digest failed for {company['company_name']}"
                    f": {str(e)}"
                )

    except Exception as e:
        logger.error(f"Scheduled digest error: {str(e)}")


async def _auto_close_old_conversations():
    from app.api.deps import dependency_storage
    from app.core.enums import ConversationStatus

    logger.info("Running auto-close check for old conversations")

    if dependency_storage is None:
        logger.error("Dependencies not initialized")
        return

    conversation_repo = dependency_storage.get_conversation_repository()

    try:
        old_conversations = await conversation_repo.find_open_older_than(
            hours=24
        )

        for conv in old_conversations:
            try:
                await conversation_repo.update_status(
                    conv.conversationId,
                    ConversationStatus.CLOSED,
                    summary="Auto-closed after 24 hours of inactivity."
                )
                logger.info(
                    f"Auto-closed conversation: {conv.conversationId}"
                )
            except Exception as e:
                logger.error(
                    f"Failed to auto-close {conv.conversationId}: {str(e)}"
                )

    except Exception as e:
        logger.error(f"Auto-close job error: {str(e)}")