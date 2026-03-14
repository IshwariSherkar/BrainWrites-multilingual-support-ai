from app.repositories.auth import AuthRepository
from typing import Optional, Tuple, Dict
from datetime import datetime
import uuid
from app.schemas.auth import UserRegisterRequest
from app.models.user import AuthUser, EntityType
from app.core.exceptions import DuplicateRequestException
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    jwt
)
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__file__)

class AuthService:
    def __init__(self, auth_repository: AuthRepository):
        self.auth_repository = auth_repository

    async def register(self, data: UserRegisterRequest) -> AuthUser:
        existing_user = await self.auth_repository.find_by_email(data.email)
        if existing_user:
            raise DuplicateRequestException(
                "User with this email already exists"
            )
        auth_user = AuthUser(
            email=data.email,
            userId=str(uuid.uuid4()),
            # properely hashed now
            hashed_password=get_password_hash(data.password),
            entity_type=data.entity_type,
        )
        return await self.auth_repository.create(auth_user)

    async def authenticate(
        self, email: str, password: str
    ) -> Optional[AuthUser]:
        user = await self.auth_repository.find_by_email(email)
        if not user:
            return None
        # bcrypt verification
        if not verify_password(password, user.hashed_password):
            return None
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[AuthUser]:
        return await self.auth_repository.find_by_user_id(user_id)

    async def delete_user_by_userId(self, user_id: str) -> None:
        return await self.auth_repository.delete_by_user_id(user_id)

    async def update_user(
        self, user_id: str, data: Dict
    ) -> Optional[AuthUser]:
        return await self.auth_repository.update(user_id, data)

    async def create_tokens(
        self, user: AuthUser
    ) -> Tuple[str, str]:
        data = {
            "sub": user.userId,
            "email": user.email,
            "entity_type": user.entity_type
        }
        access_token = create_access_token(data)
        refresh_token = create_refresh_token(data)
        return access_token, refresh_token

    async def verify_token(self, token: str) -> Optional[Dict]:
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            token_type = payload.get("type")
            if token_type not in ["access", "refresh"]:
                raise ValueError("Invalid token type")

            exp = payload.get("exp")
            if exp is None:
                raise ValueError("Token missing expiration")

            if datetime.utcnow() > datetime.fromtimestamp(exp):
                raise ValueError("Token has expired")

            return payload

        except (jwt.JWTError, ValueError) as e:
            logger.error(f"Token verification failed: {str(e)}")
            return None