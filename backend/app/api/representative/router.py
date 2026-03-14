from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.logging import get_logger
from app.schemas.representative import (
    RepresentativeRegisterRequest,
    RepresentativeProfileResponse,
    RepresentativeProfileUpdate
)
from app.services.representative import RepresentativeService
from app.api.deps import get_representative_service
from app.core.enums import EntityType
from app.core.decorators import allowed_entities

router = APIRouter(prefix="/representative", tags=["representative"])
logger = get_logger(__name__)


@router.post("/register", response_model=RepresentativeProfileResponse)
async def register_representative(
    request: Request,
    data: RepresentativeRegisterRequest,
    representative_service: RepresentativeService = Depends(
        get_representative_service
    )
) -> RepresentativeProfileResponse:
    profile = await representative_service.register_representative(
        data
    )
    return RepresentativeProfileResponse(
        success=True,
        message="Representative registered successfully",
        data=profile.model_dump()
    )


@router.get("/me", response_model=RepresentativeProfileResponse)
@allowed_entities([EntityType.REPRESENTATIVE])
async def get_my_profile(
    request: Request,
    representative_service: RepresentativeService = Depends(
        get_representative_service
    )
) -> RepresentativeProfileResponse:
    profile = await representative_service.get_profile(
        request.state.user.userId
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return RepresentativeProfileResponse(
        success=True,
        message="Profile retrieved successfully",
        data=profile.model_dump()
    )


@router.put("/me", response_model=RepresentativeProfileResponse)
@allowed_entities([EntityType.REPRESENTATIVE])
async def update_my_profile(
    request: Request,
    data: RepresentativeProfileUpdate,
    representative_service: RepresentativeService = Depends(
        get_representative_service
    )
) -> RepresentativeProfileResponse:
    await representative_service.update_profile(
        request.state.user.userId, data
    )
    return RepresentativeProfileResponse(
        success=True,
        message="Profile updated successfully"
    )


@router.delete("/me", response_model=RepresentativeProfileResponse)
@allowed_entities([EntityType.REPRESENTATIVE])
async def delete_my_profile(
    request: Request,
    representative_service: RepresentativeService = Depends(
        get_representative_service
    )
) -> RepresentativeProfileResponse:
    await representative_service.delete_profile(
        request.state.user.userId
    )
    return RepresentativeProfileResponse(
        success=True,
        message="Profile deleted successfully"
    )


@router.get(
    "/team",
    response_model=RepresentativeProfileResponse
)
@allowed_entities([EntityType.ADMIN])
async def get_company_team(
    request: Request,
    representative_service: RepresentativeService = Depends(
        get_representative_service
    )
) -> RepresentativeProfileResponse:
    representatives = await (
        representative_service.get_company_representatives(
            request.state.user.userId
        )
    )
    return RepresentativeProfileResponse(
        success=True,
        message="Team retrieved successfully",
        data={"team": [r.model_dump() for r in representatives]}
    )