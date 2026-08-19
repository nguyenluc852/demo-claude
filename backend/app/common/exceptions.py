"""Application errors carrying an HTTP status, a stable code, and a message.

Raise these from services; main.py turns them into an ErrorResponse body.
"""

from fastapi import status

from app.core.messages import ErrorCode, ErrorMessage


class AppError(Exception):
    """Base for every error the API deliberately returns."""

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    code: str = ErrorCode.INTERNAL_ERROR
    message: str = ErrorMessage.INTERNAL_ERROR

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.message)
        if message is not None:
            self.message = message


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = ErrorCode.NOT_FOUND


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = ErrorCode.CONFLICT


class BadRequestError(AppError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = ErrorCode.BAD_REQUEST


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = ErrorCode.UNAUTHORIZED
    message = ErrorMessage.NOT_AUTHENTICATED


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = ErrorCode.FORBIDDEN
    message = ErrorMessage.FORBIDDEN


class EmailDeliveryError(AppError):
    """The mail provider refused or never answered.

    502 rather than 500: the request was fine, an upstream service was not.
    Callers that mail in bulk catch this per message so one bad address cannot
    abort the batch.
    """

    status_code = status.HTTP_502_BAD_GATEWAY
    code = ErrorCode.EMAIL_FAILED
    message = ErrorMessage.EMAIL_SEND_FAILED
