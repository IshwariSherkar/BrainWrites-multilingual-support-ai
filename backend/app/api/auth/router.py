from fastapi import APIRouter, Depends, HTTPException, Response, status, Request
from pydantic import BaseModel
from app.services.auth import AuthService
from app.schemas.auth import TokenResponse
from app.api.deps import get_auth_service
from app.core.enums import EntityType

class LoginRequest(BaseModel):
    username: str
    password: str
    entity_type: EntityType

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    data: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
) -> TokenResponse:
    # Step 1 - authenticate credentials
    user = await auth_service.authenticate(
        data.username, data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 2 - check entity type matches
    if user.entity_type != data.entity_type:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Entity type mismatch",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Step 3 - create tokens
    access_token, refresh_token = await auth_service.create_tokens(
        user
    )

    # Step 4 - set refresh token in HTTP-only cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 7
    )

    return TokenResponse(
        success=True,
        message="Login successful",
        data={
            "access_token": access_token,
            "token_type": "bearer"
        }
    )