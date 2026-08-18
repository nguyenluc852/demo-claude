from fastapi import APIRouter, Query, status

from app.common.deps import CurrentUserDep
from app.common.schemas import DataResponse
from app.core.constants import QueryParam, Route, Tag
from app.core.messages import SuccessMessage
from app.schemas.auth import (
    LoginRequest,
    MessageResponse,
    ResendVerificationRequest,
    TokenResponse,
)
from app.schemas.user import UserCreate, UserSchema
from app.services.auth import auth_service

router = APIRouter(tags=[Tag.AUTH])


@router.post(
    Route.AUTH_REGISTER,
    response_model=DataResponse[TokenResponse],
    status_code=status.HTTP_201_CREATED,
)
async def register(payload: UserCreate) -> DataResponse[TokenResponse]:
    return DataResponse(data=await auth_service.register(payload))


@router.post(Route.AUTH_LOGIN, response_model=DataResponse[TokenResponse])
async def login(payload: LoginRequest) -> DataResponse[TokenResponse]:
    return DataResponse(data=await auth_service.login(payload))


@router.get(Route.AUTH_ME, response_model=DataResponse[UserSchema])
async def me(user: CurrentUserDep) -> DataResponse[UserSchema]:
    return DataResponse(data=user)


@router.post(Route.AUTH_VERIFY, response_model=DataResponse[MessageResponse])
async def verify_email(
    token: str = Query(alias=QueryParam.TOKEN),
) -> DataResponse[MessageResponse]:
    await auth_service.verify_email(token)
    return DataResponse(data=MessageResponse(message=SuccessMessage.EMAIL_VERIFIED))


@router.post(Route.AUTH_RESEND_VERIFICATION, response_model=DataResponse[MessageResponse])
async def resend_verification(
    payload: ResendVerificationRequest,
) -> DataResponse[MessageResponse]:
    await auth_service.resend_verification(payload.email)
    return DataResponse(data=MessageResponse(message=SuccessMessage.VERIFICATION_SENT))
