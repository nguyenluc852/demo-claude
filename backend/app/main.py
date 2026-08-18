from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette import status

from app.api.v1.router import api_router
from app.common.exceptions import AppError
from app.common.schemas import ErrorDetail, ErrorResponse
from app.core.config import settings
from app.core.constants import ApiPrefix, AppMeta
from app.core.messages import ErrorCode, ErrorMessage
from app.db import mongo
from app.services import scheduler
from app.services.service_setting import service_setting_service


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Own the Mongo connection and the monthly mailer for the process lifetime."""
    await mongo.connect()
    await service_setting_service.ensure_defaults()
    scheduler.start()
    try:
        yield
    finally:
        scheduler.shutdown()
        await mongo.close()


app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    debug=settings.debug,
    docs_url=AppMeta.DOCS_URL,
    openapi_url=AppMeta.OPENAPI_URL,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=ApiPrefix.ROOT)


def _error_body(code: str, message: str) -> dict[str, object]:
    return ErrorResponse(error=ErrorDetail(code=code, message=message)).model_dump()


@app.exception_handler(AppError)
async def handle_app_error(_: Request, exc: AppError) -> JSONResponse:
    """Every deliberate error surfaces through the same envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_body(exc.code, exc.message),
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(_: Request, __: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_error_body(ErrorCode.VALIDATION_ERROR, ErrorMessage.VALIDATION_FAILED),
    )
