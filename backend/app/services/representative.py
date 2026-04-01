from typing import Optional, Tuple
from app.repositories.representative import RepresentativeRepository
from app.services.auth import AuthService
from app.models.user import RepresentativeProfile
from app.schemas.representative import (
    RepresentativeRegisterRequest,
    RepresentativeProfileSchema,
    RepresentativeProfileUpdate
)
from app.schemas.auth import UserRegisterRequest
from app.core.enums import EntityType
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException

logger = get_logger(__name__)

class RepresentativeService:
    def __init__(
        self,
        representative_repository: RepresentativeRepository,
        auth_service: AuthService
    ):
        self.representative_repository = representative_repository
        self.auth_service = auth_service

    async def get_profile(
        self, user_id: str
    ) -> Optional[RepresentativeProfile]:
        return await self.representative_repository.find_by_user_id(
            user_id
        )

    # first craete auth credentials and them crate profile linked to comapny via comapany id
    async def register_representative(
        self, data: RepresentativeRegisterRequest
    ) -> RepresentativeProfileSchema:
        # Step 1 - create auth credentials
        rep_auth_data = UserRegisterRequest(
            email=data.email,
            password=data.password,
            entity_type=EntityType.REPRESENTATIVE,
        )
        user = await self.auth_service.register(rep_auth_data)

        # Step 2 - create representative profile
        representative = RepresentativeProfile(
            userId=user.userId,
            companyId=data.companyId,
            email=data.email,
            full_name=data.name,
            language=data.language,
        )
        profile = await self.representative_repository.create(
            representative
        )
        logger.info(
            "Representative registered successfully.",
            representative_id=profile.userId,
            email=data.email,
            company_id=data.companyId
        )
        return RepresentativeProfileSchema(**profile.model_dump())

    # they can only update name and language only
    async def update_profile(
        self, user_id: str,
        data: RepresentativeProfileUpdate
    ) -> RepresentativeProfile:
        profile = await self.representative_repository.find_by_user_id(
            user_id
        )
        if not profile:
            raise NotFoundException(
                message="Representative profile not found",
                details={"user_id": user_id}
            )
        return await self.representative_repository.update(
            user_id, data.dict_not_none()
        )

    # delete both representative profile AND their auth credentials.
    async def delete_profile(self, user_id: str) -> None:
        profile = await self.representative_repository.find_by_user_id(
            user_id
        )
        if profile:
            await self.representative_repository.delete(profile.userId)
            await self.auth_service.delete_user_by_userId(user_id)
        else:
            raise NotFoundException(
                message="Profile not found",
                details={"user_id": user_id}
            )

    #  this is for admin to view all representatives lists
    async def get_company_representatives(
        self, company_id: str
    ) -> list:
        representatives = await (
            self.representative_repository.find_by_company_id(company_id)
        )
        return [
            RepresentativeProfileSchema(**r.model_dump())
            for r in representatives
        ]