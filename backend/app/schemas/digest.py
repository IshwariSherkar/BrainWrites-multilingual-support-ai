from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.enums import DigestTrigger
from datetime import datetime

# jr koni manually mail send trigger kela from frontend tr 
class DigestRequestSchema(BaseModel):
    trigger: DigestTrigger = Field(
        default=DigestTrigger.MANUAL,
        description="How the digest was triggered"
    )

# the actual analytics data that goes inside the digest email and analytics dashboard
class DigestStatsSchema(BaseModel):
    total_conversations: int # kiti conversations zale yesterday
    avg_quality_score: float  # average score sarva message
    language_distribution: dict  # dict like {"hindi": 18, "marathi": 14, "gujarati": 9}
    top_complaint_topics: List[dict]  #  list like [{"topic": "delivery", "count": 19}]
    worst_messages: List[dict]   # list like [{"topic": "delivery", "count": 19}]

# full read view of a digest record saved in MongoDB. 
# Used when admin wants to see history of all digests ever sent
class DigestSchema(BaseModel):
    digestId: str
    companyId: str
    adminId: str
    trigger: DigestTrigger
    date_covered: Optional[str] = None
    email_content: Optional[str] = None
    status: str
    created_at: datetime

# standard API response after digest is triggered. 
# Returns success, message, and optionally the digest stats in data
class DigestResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None