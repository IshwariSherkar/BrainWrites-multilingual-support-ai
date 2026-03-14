from enum import Enum

class CollectionName(str, Enum):
    AUTH_USERS = "auth_users" #stores login credentials for everyone
    COMPANIES = "companies" # stores company/admin profiles
    REPRESENTATIVES = "representatives"   #   stores support staff profiles
    CONVERSATIONS = "conversations"    # each customer interaction is one conversation
    MESSAGES = "messages"   #   each processed response within a conversation
    DIGESTS = "digests"  # log of every digest email sent

    @classmethod
    def get_all(cls):
        return [v.value for v in cls.__members__.values()]

    @classmethod
    def get_by_entity_type(cls, entity_type: str) -> str:
        if entity_type == "representative":
            return cls.REPRESENTATIVES.value
        elif entity_type == "admin":
            return cls.COMPANIES.value
        raise ValueError(f"Unknown entity type: {entity_type}")