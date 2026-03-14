import httpx
from fastapi import Request, HTTPException, status
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

async def verify_clerk_token(token: str) -> dict:
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
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Clerk token"
                )
            return response.json()
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clerk token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token verification failed"
        )

async def get_clerk_user(request: Request) -> dict:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No authorization token provided"
        )
    token = auth_header.split(" ")[1]
    return await verify_clerk_token(token)