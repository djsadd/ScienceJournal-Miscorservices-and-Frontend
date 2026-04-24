from pydantic import BaseModel, EmailStr, Field
from typing import List


class UserCreate(BaseModel):
    username: str
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    organization: str | None = None
    institution: str | None = None
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str = "author"
    preferred_language: str | List[str] | None = None
    academic_degrees: List[str] | None = None
    orcid: str | None = None
    reviewer_science_fields: List[str] | None = None
    reviewer_science_other: str | None = None
    accept_terms: bool = False
    notify_status: bool = True


class UserOut(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    organization: str | None = None
    institution: str | None = None
    email: EmailStr
    role: str
    is_active: bool
    is_hidden: bool = False
    accept_terms: bool
    notify_status: bool

    class Config:
        orm_mode = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None


class UserFullInfo(BaseModel):
    """Complete user information from Auth and User Profile services"""

    id: int
    username: str
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    organization: str | None = None
    institution: str | None = None
    email: EmailStr
    role: str
    is_active: bool = True
    is_hidden: bool = False
    accept_terms: bool
    notify_status: bool
    profile_id: int | None = None
    phone: str | None = None
    preferred_language: str | None = None
    academic_degrees: list[str] = []
    orcid: str | None = None
    reviewer_science_fields: list[str] = []
    reviewer_science_other: str | None = None
    roles: list[str] = []

    class Config:
        orm_mode = True


class UserActivationUpdate(BaseModel):
    is_active: bool


class UserRoleUpdate(BaseModel):
    role: str


class AdminUserListItem(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    organization: str | None = None
    institution: str | None = None
    email: EmailStr
    role: str
    is_active: bool
    is_hidden: bool = False
    accept_terms: bool
    notify_status: bool
    phone: str | None = None
    preferred_language: str | None = None
    academic_degrees: list[str] = []
    orcid: str | None = None
    reviewer_science_fields: list[str] = []
    reviewer_science_other: str | None = None
    roles: list[str] = []
    profile_id: int | None = None
    is_council_member: bool | None = None
    is_collegium_member: bool | None = None


class AdminUserDetail(AdminUserListItem):
    pass


class AdminUserStats(BaseModel):
    total: int
    active: int
    inactive: int
    pending: int
    by_role: dict[str, int]


class AdminPasswordResetRequest(BaseModel):
    new_password: str | None = Field(default=None, min_length=8, max_length=128)


class AdminPasswordResetResponse(BaseModel):
    user_id: int
    temporary_password: str
    generated: bool


class AdminUserHideResponse(BaseModel):
    user_id: int
    is_hidden: bool


class RefreshTokenRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str


class LoginRequest(BaseModel):
    """Login payload supporting username OR email as identifier."""

    username: str
    password: str
