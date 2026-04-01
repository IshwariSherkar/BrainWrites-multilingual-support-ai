from fastapi import APIRouter, Depends, HTTPException, status, Request
from app.core.logging import get_logger
from app.schemas.admin import (
    CompanyRegisterRequest,
    CompanyProfileResponse,
    CompanyProfileUpdate
)
from app.services.admin import AdminService
from app.services.digest import DigestService
from app.api.deps import get_admin_service, get_digest_service
from app.core.enums import EntityType, DigestTrigger
from app.core.decorators import allowed_entities

router = APIRouter(prefix="/admin", tags=["admin"])
logger = get_logger(__name__)


@router.post("/register", response_model=CompanyProfileResponse)
async def register_admin(
    request: Request,
    data: CompanyRegisterRequest,
    admin_service: AdminService = Depends(get_admin_service)
) -> CompanyProfileResponse:
    profile = await admin_service.register_admin(data)
    return CompanyProfileResponse(
        success=True,
        message="Company registered successfully",
        data=profile.model_dump()
    )


@router.get("/me", response_model=CompanyProfileResponse)
@allowed_entities([EntityType.ADMIN])
async def get_my_profile(
    request: Request,
    admin_service: AdminService = Depends(get_admin_service)
) -> CompanyProfileResponse:
    # First try direct lookup (company owner)
    profile = await admin_service.get_profile(
        request.state.user.userId
    )
    # If not found, try manager lookup by email
    if not profile:
        profile = await admin_service.check_manager_email(
            request.state.user.email
        )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    return CompanyProfileResponse(
        success=True,
        message="Profile retrieved successfully",
        data=profile.model_dump()
    )


@router.put("/me", response_model=CompanyProfileResponse)
@allowed_entities([EntityType.ADMIN])
async def update_my_profile(
    request: Request,
    data: CompanyProfileUpdate,
    admin_service: AdminService = Depends(get_admin_service)
) -> CompanyProfileResponse:
    # Get correct company_id for both owner and manager
    company_id = request.state.user.userId
    profile = await admin_service.get_profile(company_id)
    if not profile:
        mgr_profile = await admin_service.check_manager_email(
            request.state.user.email
        )
        if mgr_profile:
            company_id = mgr_profile.userId
    await admin_service.update_profile(company_id, data)
    return CompanyProfileResponse(
        success=True,
        message="Profile updated successfully"
    )


@router.delete("/me", response_model=CompanyProfileResponse)
@allowed_entities([EntityType.ADMIN])
async def delete_my_profile(
    request: Request,
    admin_service: AdminService = Depends(get_admin_service)
) -> CompanyProfileResponse:
    await admin_service.delete_profile(request.state.user.userId)
    return CompanyProfileResponse(
        success=True,
        message="Profile deleted successfully"
    )


@router.post("/digest", response_model=CompanyProfileResponse)
@allowed_entities([EntityType.ADMIN])
async def trigger_digest(
    request: Request,
    digest_service: DigestService = Depends(get_digest_service),
    admin_service: AdminService = Depends(get_admin_service)
) -> CompanyProfileResponse:
    # Get correct company_id for both owner and manager
    company_id = request.state.user.userId
    profile = await admin_service.get_profile(company_id)
    if not profile:
        mgr_profile = await admin_service.check_manager_email(
            request.state.user.email
        )
        if mgr_profile:
            company_id = mgr_profile.userId
    digest = await digest_service.send_digest(
        company_id=company_id,
        admin_id=request.state.user.userId,
        trigger=DigestTrigger.MANUAL
    )
    return CompanyProfileResponse(
        success=True,
        message="Digest email sent successfully",
        data={"digestId": digest.digestId}
    )


@router.get("/analytics", response_model=CompanyProfileResponse)
@allowed_entities([EntityType.ADMIN])
async def get_analytics(
    request: Request,
    digest_service: DigestService = Depends(get_digest_service),
    admin_service: AdminService = Depends(get_admin_service)
) -> CompanyProfileResponse:
    from datetime import datetime, timedelta
    today = datetime.utcnow().replace(
        hour=23, minute=59, second=59, microsecond=0
    )
    start = today - timedelta(days=30)
    stats = await digest_service._collect_stats(
        company_id,
        start,
        today
    )

    # Get correct company_id for both owner and manager
    company_id = request.state.user.userId
    profile = await admin_service.get_profile(company_id)
    if not profile:
        mgr_profile = await admin_service.check_manager_email(
            request.state.user.email
        )
        if mgr_profile:
            company_id = mgr_profile.userId

    stats = await digest_service._collect_stats(
        company_id,
        yesterday_start,
        yesterday_end
    )
    return CompanyProfileResponse(
        success=True,
        message="Analytics retrieved successfully",
        data=stats.model_dump()
    )


from app.schemas.admin import AddManagerRequest, AddRepresentativeRequest

@router.post("/managers")
@allowed_entities([EntityType.ADMIN])
async def add_manager(
    request: Request,
    data: AddManagerRequest,
    admin_service: AdminService = Depends(get_admin_service)
):
    # Get correct company_id for both owner and manager
    company_id = request.state.user.userId
    profile = await admin_service.get_profile(company_id)
    if not profile:
        mgr_profile = await admin_service.check_manager_email(
            request.state.user.email
        )
        if mgr_profile:
            company_id = mgr_profile.userId
    await admin_service.add_manager(company_id, data.email, data.full_name)
    return {"success": True, "message": "Manager added successfully"}


@router.post("/representatives")
@allowed_entities([EntityType.ADMIN])
async def add_representative(
    request: Request,
    data: AddRepresentativeRequest,
    admin_service: AdminService = Depends(get_admin_service)
):
    # Get correct company_id for both owner and manager
    company_id = request.state.user.userId
    profile = await admin_service.get_profile(company_id)
    if not profile:
        mgr_profile = await admin_service.check_manager_email(
            request.state.user.email
        )
        if mgr_profile:
            company_id = mgr_profile.userId
    await admin_service.add_representative(
        company_id, data.email, data.full_name
    )
    return {"success": True, "message": "Representative added successfully"}


@router.get("/check-manager")
async def check_manager_email(
    email: str,
    admin_service: AdminService = Depends(get_admin_service)
):
    profile = await admin_service.check_manager_email(email)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not authorized as manager"
        )
    return {
        "success": True,
        "message": "Manager authorized",
        "data": {
            "company_id": profile.userId,
            "company_name": profile.company_name
        }
    }


@router.get("/check-representative")
async def check_representative_email(
    email: str,
    admin_service: AdminService = Depends(get_admin_service)
):
    profile = await admin_service.check_representative_email(email)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email not authorized as representative"
        )
    return {
        "success": True,
        "message": "Representative authorized",
        "data": {
            "company_id": profile.userId,
            "company_name": profile.company_name
        }
    }


@router.get("/by-slug/{slug}")
async def get_company_by_slug(
    slug: str,
    admin_service: AdminService = Depends(get_admin_service)
):
    profile = await admin_service.get_company_by_slug(slug)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    return {
        "success": True,
        "data": {
            "company_id": profile.userId,
            "company_name": profile.company_name
        }
    }