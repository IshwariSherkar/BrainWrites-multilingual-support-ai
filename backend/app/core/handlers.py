from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from .exceptions import AppException
from .logging import get_logger

logger = get_logger(__name__)

async def app_exception_handler(request: Request, exc: AppException):
    logger.error("App exception", exc_info=exc)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details
        }
    )

async def validation_exception_handler(request: Request, exc: ValidationError):
    details = []
    logger.error("Validation exception", exc_info=exc)
    for error in exc.errors():
        details.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "message": "Validation error",
            "error_code": "VALIDATION_ERROR",
            "details": details
        }
    )

async def generic_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception", exc_info=exc)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error_code": "INTERNAL_SERVER_ERROR"
        }
    )
