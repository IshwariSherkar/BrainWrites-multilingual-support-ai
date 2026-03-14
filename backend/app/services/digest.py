from typing import Optional
from datetime import datetime, timedelta
from app.repositories.digest import DigestRepository
from app.repositories.company import CompanyRepository
from app.repositories.conversation import ConversationRepository
from app.repositories.message import MessageRepository
from app.models.user import Digest
from app.schemas.digest import DigestStatsSchema
from app.core.enums import DigestTrigger
from app.core.logging import get_logger
from app.core.config import settings
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = get_logger(__name__)


class DigestService:
    def __init__(
        self,
        digest_repository: DigestRepository,
        company_repository: CompanyRepository,
        conversation_repository: ConversationRepository,
        message_repository: MessageRepository
    ):
        self.digest_repository = digest_repository
        self.company_repository = company_repository
        self.conversation_repository = conversation_repository
        self.message_repository = message_repository

    async def send_digest(
        self,
        company_id: str,
        admin_id: str,
        trigger: DigestTrigger
    ) -> Digest:
        # Step 1 — get yesterday's date range
        today = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        yesterday_start = today - timedelta(days=1)
        yesterday_end = today

        # Step 2 — get company details
        company = await self.company_repository.find_by_user_id(
            company_id
        )
        if not company:
            raise ValueError("Company not found")

        # Step 3 — collect stats from MongoDB
        stats = await self._collect_stats(
            company_id, yesterday_start, yesterday_end
        )

        # Step 4 — build email content
        email_content = self._build_email(
            company.company_name, stats, yesterday_start
        )

        # Step 5 — send email to admin
        self._send_email(
            to_email=company.email,
            subject=(
                f"Daily Support Digest — "
                f"{yesterday_start.strftime('%d %b %Y')} | "
                f"{company.company_name}"
            ),
            body=email_content
        )

        # Step 6 — save digest record to MongoDB
        digest = Digest(
            companyId=company_id,
            adminId=admin_id,
            trigger=trigger,
            date_covered=yesterday_start.strftime("%Y-%m-%d"),
            email_content=email_content,
            status="sent"
        )
        saved = await self.digest_repository.create(digest)
        logger.info(
            f"Digest sent for company: {company_id} "
            f"trigger: {trigger.value}"
        )
        return saved

    async def _collect_stats(
        self,
        company_id: str,
        date_start: datetime,
        date_end: datetime
    ) -> DigestStatsSchema:
        # Get all conversations from yesterday
        conversations = await (
            self.conversation_repository.find_by_company_and_date(
                company_id, date_start, date_end
            )
        )

        # Get all messages from yesterday
        messages = await (
            self.message_repository.find_by_company_and_date(
                company_id, date_start, date_end
            )
        )

        # Total conversations
        total_conversations = len(conversations)

        # Average quality score
        avg_quality_score = 0.0
        if messages:
            avg_quality_score = round(
                sum(m.quality_score for m in messages) / len(messages),
                2
            )

        # Language distribution
        language_distribution = {}
        for m in messages:
            if m.detected_language:
                lang = m.detected_language.value
                language_distribution[lang] = (
                    language_distribution.get(lang, 0) + 1
                )

        # Top complaint topics
        topic_counts = {}
        for m in messages:
            if m.complaint_topic:
                topic = m.complaint_topic.value
                topic_counts[topic] = topic_counts.get(topic, 0) + 1

        top_complaint_topics = [
            {"topic": k, "count": v}
            for k, v in sorted(
                topic_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:3]
        ]

        # Top 3 worst messages
        worst_messages = await (
            self.message_repository.find_worst_by_company_and_date(
                company_id, date_start, date_end, limit=3
            )
        )
        worst_messages_data = [
            {
                "messageId": m.messageId,
                "quality_score": m.quality_score,
                "complaint_topic": (
                    m.complaint_topic.value
                    if m.complaint_topic else "general"
                ),
                "handled_by": m.handled_by
            }
            for m in worst_messages
        ]

        return DigestStatsSchema(
            total_conversations=total_conversations,
            avg_quality_score=avg_quality_score,
            language_distribution=language_distribution,
            top_complaint_topics=top_complaint_topics,
            worst_messages=worst_messages_data
        )

    def _build_email(
        self,
        company_name: str,
        stats: DigestStatsSchema,
        date: datetime
    ) -> str:
        # Language distribution lines
        lang_lines = "\n".join([
            f"  {lang.capitalize():<12} → {count} conversations"
            for lang, count in stats.language_distribution.items()
        ])

        # Topic lines
        topic_lines = "\n".join([
            f"  {i+1}. {t['topic'].capitalize()} ({t['count']})"
            for i, t in enumerate(stats.top_complaint_topics)
        ])

        # Worst messages lines
        worst_lines = "\n".join([
            f"  Score: {m['quality_score']}/100 — "
            f"{m['complaint_topic'].capitalize()} — "
            f"Handled by: {m['handled_by']}"
            for m in stats.worst_messages
        ])

        return f"""
Daily Support Digest — {date.strftime('%d %b %Y')}
Company: {company_name}
{'='*50}

OVERVIEW
Total Conversations Yesterday : {stats.total_conversations}
Average Quality Score         : {stats.avg_quality_score}/100

LANGUAGE DISTRIBUTION
{lang_lines if lang_lines else "  No data available"}

MOST COMMON COMPLAINT TOPICS
{topic_lines if topic_lines else "  No data available"}

TOP 3 WORST PERFORMING RESPONSES
{worst_lines if worst_lines else "  No data available"}

{'='*50}
This digest was generated automatically by your
Multilingual Customer Support System.
        """.strip()

    def _send_email(
        self,
        to_email: str,
        subject: str,
        body: str
    ) -> None:
        try:
            msg = MIMEMultipart()
            msg["From"] = settings.GMAIL_ADDRESS
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            with smtplib.SMTP_SSL(
                "smtp.gmail.com", 465
            ) as server:
                server.login(
                    settings.GMAIL_ADDRESS,
                    settings.GMAIL_APP_PASSWORD
                )
                server.sendmail(
                    settings.GMAIL_ADDRESS,
                    to_email,
                    msg.as_string()
                )
            logger.info(f"Digest email sent to: {to_email}")

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            raise
