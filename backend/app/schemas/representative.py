from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.core.enums import SupportedLanguage


class RepresentativeRegisterRequest(BaseModel):
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Full name of the representative"
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
    companyId: str = Field(
        ...,
        description="Company ID the representative belongs to"
    )
    language: SupportedLanguage = Field(
        default=SupportedLanguage.ENGLISH,
        description="Representative's primary language"
    )

#  read-only view of representative profile, 
# includes total_handled and avg_score 
# so admin can see their performance
class RepresentativeProfileSchema(BaseModel):
    userId: str
    email: EmailStr
    full_name: str
    companyId: str
    language: SupportedLanguage
    total_handled: int
    avg_score: float

# representative can only update their name and language, nothing else
# total handle and avg score will be updated automatically by the system
class RepresentativeProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[SupportedLanguage] = None

    def dict_not_none(self):
        return {
            k: v for k, v in self.model_dump().items()
            if v is not None
        }

# this is send back to frontend
class RepresentativeProfileResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None