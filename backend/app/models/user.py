from .base import DBModelBase
from uuid import uuid4
from pydantic import EmailStr, Field
from ..core.enums import (
    EntityType,
    Industry,
    ToneType,
    ComplaintTopic,
    ConversationStatus,
    SupportedLanguage,
    DigestTrigger,
    AIProvider
)
from typing import Optional
from enum import Enum
from datetime import datetime

# Auth User 
class AuthUserFields(str, Enum):
    userId = "userId"
    email = "email"
    hashed_password = "hashed_password"
    entity_type = "entity_type"

class AuthUser(DBModelBase):
    userId: str = Field(default_factory=lambda: str(uuid4()))
    email: EmailStr
    hashed_password: str
    entity_type: EntityType

class AuthProfile(DBModelBase):
    userId: str = Field(..., description="Reference to AuthUser.userId")
    email: EmailStr
    hashed_password: Optional[str] = None
    entity_type: Optional[str] = None

# Company (Admin) - admin's profile now includes company details like name, industry, preferred tone and output language

class CompanyProfileFields(str, Enum):
    userId = "userId"
    email = "email"
    full_name = "full_name"
    company_name = "company_name"
    industry = "industry"
    default_tone = "default_tone"
    output_language = "output_language"
    digest_enabled = "digest_enabled"

class CompanyProfile(DBModelBase):
    userId: str = Field(..., description="Reference to AuthUser.userId")
    email: EmailStr
    full_name: str
    company_name: str
    industry: Industry = Industry.OTHER
    default_tone: ToneType = ToneType.PROFESSIONAL
    output_language: SupportedLanguage = SupportedLanguage.ENGLISH
    digest_enabled: bool = True
    ai_provider: AIProvider = AIProvider.GROQ
    ai_api_key: Optional[str] = None
    ai_endpoint: Optional[str] = None
    manager_emails: list[str] = Field(default_factory=list)
    representative_emails: list[str] = Field(default_factory=list)

# Representative - support staff profile, linked to company via companyId, tracks their performance with total_handled and avg_score

class RepresentativeProfileFields(str, Enum):
    userId = "userId"
    email = "email"
    full_name = "full_name"
    companyId = "companyId"

class RepresentativeProfile(DBModelBase):
    userId: str = Field(..., description="Reference to AuthUser.userId")
    companyId: str = Field(..., description="Reference to CompanyProfile.userId")
    email: EmailStr
    full_name: str
    total_handled: int = Field(default=0)
    avg_score: float = Field(default=0.0)

# ─── Conversation - one customer interaction, linked to both company and representative, tracks overall quality and status
class Conversation(DBModelBase):
    conversationId: str = Field(default_factory=lambda: str(uuid4()))
    companyId: str = Field(..., description="Reference to CompanyProfile.userId")
    representativeId: Optional[str] = Field(None, description="Set only if escalated")
    customer_name: str
    customer_email: EmailStr
    customer_language: SupportedLanguage = SupportedLanguage.ENGLISH
    status: ConversationStatus = ConversationStatus.OPEN
    quality_score: float = Field(default=0.0)
    complaint_topic: Optional[ComplaintTopic] = None
    summary: Optional[str] = None
    closed_at: Optional[datetime] = None
    escalated: bool = False
    escalation_reason: Optional[str] = None

# ─── Message - one processed response inside a conversation, stores both original and processed text, quality score, tone before and after

class Message(DBModelBase):
    messageId: str = Field(default_factory=lambda: str(uuid4()))
    conversationId: str = Field(..., description="Reference to Conversation.conversationId")
    companyId: str = Field(..., description="Reference to CompanyProfile.userId")
    representativeId: Optional[str] = Field(None, description="Set only if handled by human")
    original_text: str
    processed_text: Optional[str] = None
    detected_language: Optional[SupportedLanguage] = None
    output_language: Optional[SupportedLanguage] = None
    original_tone: Optional[str] = None
    applied_tone: Optional[ToneType] = None
    quality_score: float = Field(default=0.0)
    complaint_topic: Optional[ComplaintTopic] = None
    is_closing_message: bool = False
    handled_by: str = "ai"
    recommendation: Optional[str] = None
    approved: bool = False

# ─── Digest - log of every digest email sent, who triggered it and when

class Digest(DBModelBase):
    digestId: str = Field(default_factory=lambda: str(uuid4()))
    companyId: str = Field(..., description="Reference to CompanyProfile.userId")
    adminId: str = Field(..., description="Reference to AuthUser.userId")
    trigger: DigestTrigger = DigestTrigger.SCHEDULED
    date_covered: Optional[str] = None
    email_content: Optional[str] = None
    status: str = "sent"