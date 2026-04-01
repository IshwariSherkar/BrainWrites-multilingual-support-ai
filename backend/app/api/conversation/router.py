from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.logging import get_logger
from app.schemas.conversation import (
    ConversationCreateRequest,
    ConversationResponse,
    ConversationListResponse,
    MessageCreateRequest,
    MessageResponse,
    RepresentativeMessageRequest
)
from app.services.conversation import ConversationService
from app.api.deps import get_conversation_service
from app.core.enums import EntityType
from app.core.decorators import allowed_entities

router = APIRouter(prefix="/conversation", tags=["conversation"])
logger = get_logger(__name__)


@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    request: Request,
    data: ConversationCreateRequest,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> ConversationResponse:
    company_id = request.headers.get("X-Company-ID", "")
    if not company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Company-ID header required"
        )
    conversation = await conversation_service.create_conversation(
        company_id=company_id,
        data=data
    )
    return ConversationResponse(
        success=True,
        message="Conversation started successfully",
        data=conversation.model_dump()
    )


@router.get("/", response_model=ConversationListResponse)
@allowed_entities([EntityType.ADMIN])
async def get_all_conversations(
    request: Request,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> ConversationListResponse:
    from app.api.deps import get_admin_service
    admin_service = get_admin_service()
    # Handle both company owner and manager
    company_id = request.state.user.userId
    profile = await admin_service.get_profile(company_id)
    if not profile:
        mgr_profile = await admin_service.check_manager_email(
            request.state.user.email
        )
        if mgr_profile:
            company_id = mgr_profile.userId
    conversations = await (
        conversation_service.get_company_conversations(company_id)
    )
    return ConversationListResponse(
        success=True,
        message="Conversations retrieved successfully",
        data=[c.model_dump() for c in conversations]
    )


@router.get("/by-company/{company_id}", response_model=ConversationListResponse)
@allowed_entities([EntityType.REPRESENTATIVE, EntityType.ADMIN])
async def get_conversations_for_rep(
    request: Request,
    company_id: str,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> ConversationListResponse:
    conversations = await (
        conversation_service.get_company_conversations(company_id)
    )
    return ConversationListResponse(
        success=True,
        message="Conversations retrieved successfully",
        data=[c.model_dump() for c in conversations]
    )


@router.get("/{conversation_id}", response_model=ConversationResponse)
@allowed_entities([EntityType.ADMIN, EntityType.REPRESENTATIVE])
async def get_conversation(
    request: Request,
    conversation_id: str,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> ConversationResponse:
    conversation = await conversation_service.get_conversation(
        conversation_id
    )
    return ConversationResponse(
        success=True,
        message="Conversation retrieved successfully",
        data=conversation.model_dump()
    )


@router.post(
    "/{conversation_id}/message",
    response_model=MessageResponse
)
async def process_customer_message(
    request: Request,
    conversation_id: str,
    data: MessageCreateRequest,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> MessageResponse:
    message = await conversation_service.process_customer_message(
        conversation_id=conversation_id,
        company_id=request.headers.get("X-Company-ID", ""),
        data=data
    )
    return MessageResponse(
        success=True,
        message="Message processed successfully",
        data=message.model_dump()
    )


@router.post(
    "/{conversation_id}/representative-message",
    response_model=MessageResponse
)
@allowed_entities([EntityType.REPRESENTATIVE])
async def process_representative_message(
    request: Request,
    conversation_id: str,
    data: RepresentativeMessageRequest,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> MessageResponse:
    message = await (
        conversation_service.process_representative_message(
            conversation_id=conversation_id,
            company_id=request.state.user.userId,
            representative_id=request.state.user.userId,
            data=data
        )
    )
    return MessageResponse(
        success=True,
        message="Response processed successfully",
        data=message.model_dump()
    )


@router.put(
    "/{conversation_id}/close",
    response_model=ConversationResponse
)
@allowed_entities([EntityType.ADMIN, EntityType.REPRESENTATIVE])
async def close_conversation(
    request: Request,
    conversation_id: str,
    conversation_service: ConversationService = Depends(
        get_conversation_service
    )
) -> ConversationResponse:
    conversation = await conversation_service.close_conversation(
        conversation_id=conversation_id,
        company_id=request.state.user.userId
    )
    return ConversationResponse(
        success=True,
        message="Conversation closed successfully",
        data=conversation.model_dump()
    )
