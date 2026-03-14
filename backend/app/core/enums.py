from enum import Enum

# who can log in: admin (company manager) or representative (support staff)
class EntityType(str, Enum):
    REPRESENTATIVE = "representative"
    ADMIN = "admin"

# what kind of company is using the platform
class Industry(str, Enum):
    ECOMMERCE = "ecommerce"
    BANKING = "banking"
    TELECOM = "telecom"
    HEALTHCARE = "healthcare"
    RETAIL = "retail"
    OTHER = "other"

# what tone the company wants their responses in
class ToneType(str, Enum):
    PROFESSIONAL = "professional"
    EMPATHETIC = "empathetic"
    FORMAL = "formal"
    FRIENDLY = "friendly"

#  what the customer is complaining about, detected automatically by T5
class ComplaintTopic(str, Enum):
    BILLING = "billing"
    DELIVERY = "delivery"
    REFUND = "refund"
    TECHNICAL = "technical"
    GENERAL = "general"

#  is the conversation still going or finished
class ConversationStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"

# which Indian languages your system handles
class SupportedLanguage(str, Enum):
    ENGLISH = "english"
    HINDI = "hindi"
    MARATHI = "marathi"
    GUJARATI = "gujarati"
    PUNJABI = "punjabi"

# was the digest email sent automatically at 9am or manually by manager


class DigestTrigger(str, Enum):
    SCHEDULED = "scheduled"
    MANUAL = "manual"

# comapny can add there own ai model on which our tone standardization and translation pipeline works
class AIProvider(str, Enum):
    GROQ = "groq"
    OPENAI = "openai"
    GEMINI = "gemini"
    CLAUDE = "claude"
    CUSTOM = "custom"