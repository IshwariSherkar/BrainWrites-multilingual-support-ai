from typing import Optional, Generic, TypeVar
from pydantic import BaseModel, EmailStr
from app.core.enums import EntityType

T = TypeVar('T')

class BaseResponse(BaseModel, Generic[T]):
    success: bool = True
    message: Optional[str] = None
    data: Optional[T] = None

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str
    entity_type: EntityType

class TokenData(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserData(BaseModel):
    userId: str
    email: EmailStr
    entity_type: EntityType
    full_name: Optional[str] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseResponse[TokenData]):
    data: TokenData

class UserResponse(BaseResponse[UserData]):
    data: UserData

class AuthProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None

    def dict_not_none(self):
        return {
            k: v for k, v in self.model_dump().items()
            if v is not None
        }
    
# only removing gender from auth as its not needed for auth and importing from enum rather than from models/user