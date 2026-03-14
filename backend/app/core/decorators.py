from typing import List, Optional, Callable, TypeVar
from typing_extensions import ParamSpec
from functools import wraps
from fastapi import Request, HTTPException, status
from fastapi.security.utils import get_authorization_scheme_param
from app.core.exceptions import ForbiddenException
from app.api.deps import get_auth_service
from app.core.logging import get_logger
from app.core.security import verify_token
import httpx

logger = get_logger(__name__)

P = ParamSpec("P")
R = TypeVar("R")


async def _verify_clerk_token(token: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.clerk.com/v1/me",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                }
            )
            if response.status_code != 200:
                return None
            data = response.json()
            return {
                "sub": data.get("id"),
                "email": (
                    data.get("email_addresses", [{}])[0]
                    .get("email_address", "")
                ),
                "first_name": data.get("first_name", ""),
                "last_name": data.get("last_name", "")
            }
    except Exception as e:
        logger.error(f"Clerk verification error: {str(e)}")
        return None


def allowed_entities(
    entity_types: Optional[List[str]] = None
) -> Callable[[Callable[P, R]], Callable[P, R]]:
    def decorator(
        func: Callable[P, R]
    ) -> Callable[P, R]:
        @wraps(func)
        async def wrapper(
            request: Request,
            *args: P.args,
            **kwargs: P.kwargs
        ) -> R:
            try:
                # Step 1 — get token from header
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

                # Step 2 — Try JWT first (company login)
                jwt_payload = verify_token(token)
                if jwt_payload:
                    user_id = jwt_payload.get("sub")
                    # Try finding by userId first, then by email
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

                # Step 3 — Try Clerk token (manager/representative)
                clerk_payload = await _verify_clerk_token(token)
                if clerk_payload:
                    email = clerk_payload.get("email")
                    user = await auth_service.auth_repository.find_by_email(email)

                    if not user:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="User not found in system. Please register first."
                        )

                    if entity_types and user.entity_type not in entity_types:
                        raise ForbiddenException(
                            "You don't have permission to access this resource"
                        )

                    request.state.user = user
                    request.state.clerk_payload = clerk_payload
                    return await func(request, *args, **kwargs)

                # Step 4 — Both failed
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