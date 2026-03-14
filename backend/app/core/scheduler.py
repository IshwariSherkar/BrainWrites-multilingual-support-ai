from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

scheduler = AsyncIOScheduler()


def start_scheduler():
    hour, minute = settings.DIGEST_TIME.split(":")
    scheduler.add_job(
        _send_all_digests,
        trigger=CronTrigger(hour=int(hour), minute=int(minute)),
        id="daily_digest",
        replace_existing=True
    )
    scheduler.start()
    logger.info(
        f"Scheduler started — digest at {settings.DIGEST_TIME}"
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
        # Get all companies with digest enabled
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