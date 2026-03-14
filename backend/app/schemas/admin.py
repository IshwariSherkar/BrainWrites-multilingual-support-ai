from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.core.enums import Industry, ToneType, SupportedLanguage, AIProvider

class CompanyRegisterRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Full name of the admin"
    )
    email: EmailStr = Field(
        ...,
        description="Valid email address"
    )
    password: str = Field(
        ...,
        min_length=6,
        description="Password for authentication"
    )
    company_name: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="Name of the company"
    )
    industry: Industry = Field(
        default=Industry.OTHER,
        description="Industry type of the company"
    )
    default_tone: ToneType = Field(
        default=ToneType.PROFESSIONAL,
        description="Default tone for all responses"
    )
    output_language: SupportedLanguage = Field(
        default=SupportedLanguage.ENGLISH,
        description="Default output language for responses"
    )
    ai_provider: AIProvider = Field(
        default=AIProvider.GROQ,
        description="AI provider to use for response generation"
    )
    ai_api_key: Optional[str] = Field(
        default=None,
        description="Your AI provider API key"
    )
    ai_endpoint: Optional[str] = Field(
        default=None,
        description="Custom endpoint URL for custom providers"
    )


class CompanyProfileSchema(BaseModel):
    userId: str
    email: EmailStr
    full_name: str
    company_name: str
    industry: Industry
    default_tone: ToneType
    output_language: SupportedLanguage
    digest_enabled: bool
    ai_provider: AIProvider
    ai_api_key: Optional[str] = None
    ai_endpoint: Optional[str] = None
    manager_emails: list[str] = []
    representative_emails: list[str] = []

# admin can update their company settings like changing default tone from professional to empathetic
class CompanyProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    industry: Optional[Industry] = None
    default_tone: Optional[ToneType] = None
    output_language: Optional[SupportedLanguage] = None
    digest_enabled: Optional[bool] = None
    ai_provider: Optional[AIProvider] = None
    ai_api_key: Optional[str] = None
    ai_endpoint: Optional[str] = None

    # this is so that if user gave any empty value for database while updating
    #  so to aviod overwrite all with None it only update the fields the user actually sent, ignore everything else.
    def dict_not_none(self):
        return {
            k: v for k, v in self.model_dump().items()
            if v is not None
        }

# this is send back to frontend
class CompanyProfileResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class FailedRegistration(BaseModel):
    email: EmailStr
    error: str


class AddManagerRequest(BaseModel):
    email: EmailStr
    full_name: str

class AddRepresentativeRequest(BaseModel):
    email: EmailStr
    full_name: str

class CheckEmailResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None

# renamed AdminProfileRequest → CompanyRegisterRequest and added company name, industry, default tone, output language for registration
# renamed AdminProfileSchema → CompanyProfileSchema 
# added CompanyProfileUpdateand removed gender