from typing import List, Optional, Callable, TypeVar
from typing_extensions import ParamSpec
from functools import wraps
from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from app.core.exceptions import ForbiddenException
from app.api.deps import get_auth_service
from app.core.logging import get_logger
from app.core.security import verify_token
from app.core.config import settings
import httpx
import jwt as pyjwt

logger = get_logger(__name__)

P = ParamSpec("P")
R = TypeVar("R")

# Cache Clerk JWKS
_clerk_jwks = None

async def _get_clerk_jwks():
    global _clerk_jwks
    if _clerk_jwks:
        return _clerk_jwks
    async with httpx.AsyncClient() as client:
        resp = await client.get("https://api.clerk.com/v1/jwks")
        _clerk_jwks = resp.json()
    return _clerk_jwks

async def _verify_clerk_token(token: str) -> dict:
    try:
        import jwt as pyjwt
        # Decode without verification to get email
        decoded = pyjwt.decode(
            token,
            options={"verify_signature": False},
            algorithms=["RS256", "HS256"]
        )
        
        email = decoded.get("email")
        
        # If no email in token, fetch from Clerk API using secret key
        if not email:
            sub = decoded.get("sub")
            if sub:
                async with httpx.AsyncClient() as client:
                    from app.core.config import settings
                    response = await client.get(
                        f"https://api.clerk.com/v1/users/{sub}",
                        headers={
                            "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"
                        }
                    )
                    if response.status_code == 200:
                        data = response.json()
                        emails = data.get("email_addresses", [])
                        if emails:
                            email = emails[0].get("email_address", "")

        if not email:
            return None
            
        return {
            "sub": decoded.get("sub"),
            "email": email,
        }
    except Exception as e:
        logger.error(f"Clerk verification error: {str(e)}")
        return None


def allowed_entities(
    entity_types: Optional[List[str]] = None
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(func: Callable[P, R]) -> Callable[P, R]:
        @wraps(func)
        async def wrapper(
            request: Request,
            *args: P.args,
            **kwargs: P.kwargs
        ) -> R:
            try:
                token = None
                authorization = request.headers.get("Authorization")
                if authorization:
                    scheme, token = get_authorization_scheme_param(authorization)
                    if scheme.lower() != "bearer":
                        token = None

                if not token:
                    if entity_types is not None:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Not authenticated",
                            headers={"WWW-Authenticate": "Bearer"}
                        )
                    return await func(request, *args, **kwargs)

                auth_service = get_auth_service()

                # Step 1 - Try JWT first (company login)
                jwt_payload = verify_token(token)
                if jwt_payload:
                    user_id = jwt_payload.get("sub")
                    user = await auth_service.auth_repository.find_by_user_id(user_id)
                    if not user:
                        user = await auth_service.auth_repository.find_by_email(user_id)

                    if not user:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found in system."
                        )

                    if entity_types and user.entity_type not in entity_types:
                        raise ForbiddenException(
                            "You don't have permission to access this resource"
                        )

                    request.state.user = user
                    request.state.clerk_payload = None
                    return await func(request, *args, **kwargs)

                # Step 2 - Try Clerk JWT (manager/representative)
                clerk_payload = await _verify_clerk_token(token)
                if clerk_payload:
                    email = clerk_payload.get("email")
                    if not email:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Could not extract email from token."
                        )

                    user = await auth_service.auth_repository.find_by_email(email)
                    if not user:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found. Please contact your company admin."
                        )

                    if entity_types and user.entity_type not in entity_types:
                        raise ForbiddenException(
                            "You don't have permission to access this resource"
                        )

                    request.state.user = user
                    request.state.clerk_payload = clerk_payload
                    return await func(request, *args, **kwargs)

                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token",
                    headers={"WWW-Authenticate": "Bearer"}
                )

            except ForbiddenException as e:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=str(e)
                )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail=str(e),
                    headers={"WWW-Authenticate": "Bearer"}
                )
        return wrapper
    return decorator