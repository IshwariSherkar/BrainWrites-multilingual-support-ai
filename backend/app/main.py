from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from contextlib import asynccontextmanager
from app.core.logging import setup_logging, get_logger
from app.core.database import database
from app.api.deps import initialize_dependencies
from app.core.exceptions import AppException
from app.api.demo.router import router as demo_router
from app.core.handlers import (
    app_exception_handler,
    validation_exception_handler,
    generic_exception_handler
)
from app.core.config import settings
from app.core.scheduler import start_scheduler, stop_scheduler
import uuid
import structlog

# Routers
from app.api.auth.router import router as auth_router
from app.api.admin.router import router as admin_router
from app.api.representative.router import router as representative_router
from app.api.conversation.router import router as conversation_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ─── Startup ──────────────────────────────────────
    setup_logging()
    logger = get_logger(__name__)

    try:
        await database.connect()
        logger.info("Database connection established")

        await initialize_dependencies()
        logger.info("Dependencies initialized successfully")

        start_scheduler()
        logger.info("Scheduler started")

        yield

    except Exception as e:
        logger.error(f"Failed to start application: {str(e)}")
        raise

    # ─── Shutdown ─────────────────────────────────────
    stop_scheduler()
    database.disconnect()
    logger.info("Application shutdown complete")


app = FastAPI(
    title="Major Project Backend",
    description="Multilingual Customer Support Tone Standardizer",
    version="1.0.0",
    lifespan=lifespan
)

# ─── Exception Handlers ───────────────────────────────
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# ─── CORS Middleware ──────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request ID Middleware ────────────────────────────
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    structlog.contextvars.clear_contextvars()
    structlog.contextvars.bind_contextvars(
        request_id=request_id
    )
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

# ─── API Routes ───────────────────────────────────────
app.include_router(
    auth_router,
    prefix=f"{settings.API_PREFIX}/auth",
    tags=["auth"]
)
app.include_router(
    admin_router,
    prefix=f"{settings.API_PREFIX}",
    tags=["admin"]
)
app.include_router(
    representative_router,
    prefix=f"{settings.API_PREFIX}",
    tags=["representative"]
)
app.include_router(
    conversation_router,
    prefix=f"{settings.API_PREFIX}",
    tags=["conversation"]
)
app.include_router(
    demo_router, prefix="/api/v1"
)
# ─── Root + Health ────────────────────────────────────
@app.get("/")
async def root():
    return {
        "message": "Major Project Backend API",
        "version": "1.0.0",
        "available_routes": [
            f"{settings.API_PREFIX}/auth",
            f"{settings.API_PREFIX}/admin",
            f"{settings.API_PREFIX}/representative",
            f"{settings.API_PREFIX}/conversation",
            "/health"
        ]
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}