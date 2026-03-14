from typing import Optional
from app.repositories.company import CompanyRepository
from app.services.auth import AuthService
from app.models.user import CompanyProfile
from app.schemas.admin import (
    CompanyRegisterRequest,
    CompanyProfileSchema,
    CompanyProfileUpdate
)
from app.schemas.auth import UserRegisterRequest
from app.core.enums import EntityType
from app.core.logging import get_logger
from app.core.exceptions import NotFoundException

logger = get_logger(__name__)

class AdminService:
    def __init__(
        self,
        company_repository: CompanyRepository,
        auth_service: AuthService
    ):
        self.company_repository = company_repository
        self.auth_service = auth_service

    async def get_profile(
        self, user_id: str
    ) -> Optional[CompanyProfile]:
        return await self.company_repository.find_by_user_id(user_id)

    async def register_admin(
        self, data: CompanyRegisterRequest
    ) -> CompanyProfileSchema:
        # Step 1 — create auth credentials
        admin_auth_data = UserRegisterRequest(
            email=data.email,
            password=data.password,
            entity_type=EntityType.ADMIN,
        )
        user = await self.auth_service.register(admin_auth_data)

        # Step 2 — create company profile
        company = CompanyProfile(
            userId=user.userId,
            email=data.email,
            full_name=data.name,
            company_name=data.company_name,
            industry=data.industry,
            default_tone=data.default_tone,
            output_language=data.output_language,
            digest_enabled=True
        )
        profile = await self.company_repository.create(company)
        logger.info(
            "Company registered successfully.",
            company_id=profile.userId,
            email=data.email,
            company_name=data.company_name
        )
        return CompanyProfileSchema(**profile.model_dump())

    async def update_profile(
        self, user_id: str, data: CompanyProfileUpdate
    ) -> CompanyProfile:
        profile = await self.company_repository.find_by_user_id(user_id)
        if not profile:
            raise NotFoundException(
                message="Company profile not found",
                details={"user_id": user_id}
            )
        return await self.company_repository.update(
            user_id, data.dict_not_none()
        )

    async def delete_profile(self, user_id: str) -> None:
        profile = await self.company_repository.find_by_user_id(user_id)
        if profile:
            await self.company_repository.delete(profile.userId)
            await self.auth_service.delete_user_by_userId(user_id)
        else:
            raise NotFoundException(
                message="Profile not found",
                details={"user_id": user_id}
            )
    
    async def add_manager(
        self, company_id: str, email: str, full_name: str
    ) -> CompanyProfileSchema:
        profile = await self.company_repository.find_by_user_id(company_id)
        if not profile:
            raise NotFoundException(message="Company not found", details={})
        
        if email not in profile.manager_emails:
            profile.manager_emails.append(email)
            await self.company_repository.update(
                company_id, {"manager_emails": profile.manager_emails}
            )
        return CompanyProfileSchema(**profile.model_dump())

    async def add_representative(
        self, company_id: str, email: str, full_name: str
    ) -> CompanyProfileSchema:
        profile = await self.company_repository.find_by_user_id(company_id)
        if not profile:
            raise NotFoundException(message="Company not found", details={})
        
        if email not in profile.representative_emails:
            profile.representative_emails.append(email)
            await self.company_repository.update(
                company_id, {"representative_emails": profile.representative_emails}
            )
        return CompanyProfileSchema(**profile.model_dump())

    async def check_manager_email(
        self, email: str
    ) -> Optional[CompanyProfileSchema]:
        # Find company where this email is in manager_emails
        profile = await self.company_repository.find_by_manager_email(email)
        if not profile:
            return None
        return CompanyProfileSchema(**profile.model_dump())

    async def check_representative_email(
        self, email: str
    ) -> Optional[CompanyProfileSchema]:
        profile = await self.company_repository.find_by_representative_email(email)
        if not profile:
            return None
        return CompanyProfileSchema(**profile.model_dump())
    
    async def get_company_by_slug(self, slug: str):
        # slug is company_name lowercased with spaces replaced by dashes
        all_companies = await self.company_repository.find_all()
        for company in all_companies:
            company_slug = company.company_name.lower().replace(" ", "-")
            if company_slug == slug:
                return company
        return None