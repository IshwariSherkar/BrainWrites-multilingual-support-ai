from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from app.core.enums import (
    SupportedLanguage,
    ConversationStatus,
    ComplaintTopic,
    ToneType
)
from datetime import datetime


# ─── Conversation Schemas ─────────────────────────────────
# we only need customer name, email and the language comfortable for them

class ConversationCreateRequest(BaseModel):
    customer_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Name of the customer"
    )
    customer_email: EmailStr = Field(
        ...,
        description="Customer's email address"
    )
    customer_language: SupportedLanguage = Field(
        default=SupportedLanguage.ENGLISH,
        description="Customer's preferred language"
    )

# everything else is set automatically
class ConversationSchema(BaseModel):
    conversationId: str
    companyId: str
    representativeId: Optional[str] = None
    customer_name: str
    customer_email: EmailStr
    customer_language: SupportedLanguage
    status: ConversationStatus
    quality_score: float
    complaint_topic: Optional[ComplaintTopic] = None
    summary: Optional[str] = None
    escalated: bool
    escalation_reason: Optional[str] = None
    closed_at: Optional[datetime] = None
    created_at: datetime

# returns one conversation
class ConversationResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# returns many conversations
class ConversationListResponse(BaseModel):
    success: bool
    message: str
    data: Optional[List[dict]] = None


# ─── Message Schemas ──────────────────────────────────────

# this is only to take themesage and then groq ai handles it fromhere
class MessageCreateRequest(BaseModel):
    customer_message: str = Field(
        ...,
        min_length=1,
        description="The customer's message in any Indian language"
    )
    customer_language: SupportedLanguage = Field(
        default=SupportedLanguage.ENGLISH,
        description="Customer's preferred language for response"
    )

# used when a human representative responds. 
# They send their response text and a boolean saying 
# whether they approved the system's recommendation or wrote their own
class RepresentativeMessageRequest(BaseModel):
    response_text: str = Field(
        ...,
        min_length=1,
        description="Representative's response text"
    )
    approve_recommendation: bool = Field(
        default=False,
        description="Whether representative approved system recommendation"
    )

#  full read view of a processed message including 
# original text, processed text, quality score, tone before and after
class MessageSchema(BaseModel):
    messageId: str
    conversationId: str
    companyId: str
    representativeId: Optional[str] = None
    original_text: str
    processed_text: Optional[str] = None
    detected_language: Optional[SupportedLanguage] = None
    output_language: Optional[SupportedLanguage] = None
    original_tone: Optional[str] = None
    applied_tone: Optional[ToneType] = None
    quality_score: float
    complaint_topic: Optional[ComplaintTopic] = None
    is_closing_message: bool
    handled_by: str
    recommendation: Optional[str] = None
    approved: bool
    created_at: datetime

# this is send back to frontend
class MessageResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None