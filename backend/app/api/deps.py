from app.core.database import database
from app.core.collections import CollectionName

# Repositories
from app.repositories.auth import AuthRepository
from app.repositories.company import CompanyRepository
from app.repositories.representative import RepresentativeRepository
from app.repositories.conversation import ConversationRepository
from app.repositories.message import MessageRepository
from app.repositories.digest import DigestRepository

# Services
from app.services.auth import AuthService
from app.services.admin import AdminService
from app.services.representative import RepresentativeService
from app.services.conversation import ConversationService
from app.services.digest import DigestService

# Initialize database connection
db = None
dependency_storage = None

async def initialize_db():
    global db
    await database.connect()
    db = database.db

class DependencyStorage:
    def __init__(self):
        if db is None:
            raise RuntimeError("Database not initialized")

        # ─── Repositories ─────────────────────────────────
        self._auth_repo = AuthRepository(
            db[CollectionName.AUTH_USERS.value]
        )
        self._company_repo = CompanyRepository(
            db[CollectionName.COMPANIES.value]
        )
        self._representative_repo = RepresentativeRepository(
            db[CollectionName.REPRESENTATIVES.value]
        )
        self._conversation_repo = ConversationRepository(
            db[CollectionName.CONVERSATIONS.value]
        )
        self._message_repo = MessageRepository(
            db[CollectionName.MESSAGES.value]
        )
        self._digest_repo = DigestRepository(
            db[CollectionName.DIGESTS.value]
        )

        # ─── Services ─────────────────────────────────────
        self._auth_service = AuthService(
            auth_repository=self._auth_repo
        )
        self._admin_service = AdminService(
            company_repository=self._company_repo,
            auth_service=self._auth_service
        )
        self._representative_service = RepresentativeService(
            representative_repository=self._representative_repo,
            auth_service=self._auth_service
        )
        self._conversation_service = ConversationService(
            conversation_repository=self._conversation_repo,
            message_repository=self._message_repo,
            representative_repository=self._representative_repo,
            company_repository=self._company_repo
        )
        self._digest_service = DigestService(
            digest_repository=self._digest_repo,
            company_repository=self._company_repo,
            conversation_repository=self._conversation_repo,
            message_repository=self._message_repo
        )

    # ─── Repository Getters ───────────────────────────────
    def get_auth_repository(self) -> AuthRepository:
        return self._auth_repo

    def get_company_repository(self) -> CompanyRepository:
        return self._company_repo

    def get_representative_repository(self) -> RepresentativeRepository:
        return self._representative_repo

    def get_conversation_repository(self) -> ConversationRepository:
        return self._conversation_repo

    def get_message_repository(self) -> MessageRepository:
        return self._message_repo

    def get_digest_repository(self) -> DigestRepository:
        return self._digest_repo

    # ─── Service Getters ──────────────────────────────────
    def get_auth_service(self) -> AuthService:
        return self._auth_service

    def get_admin_service(self) -> AdminService:
        return self._admin_service

    def get_representative_service(self) -> RepresentativeService:
        return self._representative_service

    def get_conversation_service(self) -> ConversationService:
        return self._conversation_service

    def get_digest_service(self) -> DigestService:
        return self._digest_service


async def initialize_dependencies():
    global dependency_storage
    await initialize_db()
    dependency_storage = DependencyStorage()


# ─── Dependency Getter Functions ──────────────────────────

def get_auth_service() -> AuthService:
    if dependency_storage is None:
        raise RuntimeError("Dependencies not initialized")
    return dependency_storage.get_auth_service()

def get_admin_service() -> AdminService:
    if dependency_storage is None:
        raise RuntimeError("Dependencies not initialized")
    return dependency_storage.get_admin_service()

def get_representative_service() -> RepresentativeService:
    if dependency_storage is None:
        raise RuntimeError("Dependencies not initialized")
    return dependency_storage.get_representative_service()

def get_conversation_service() -> ConversationService:
    if dependency_storage is None:
        raise RuntimeError("Dependencies not initialized")
    return dependency_storage.get_conversation_service()

def get_digest_service() -> DigestService:
    if dependency_storage is None:
        raise RuntimeError("Dependencies not initialized")
    return dependency_storage.get_digest_service()