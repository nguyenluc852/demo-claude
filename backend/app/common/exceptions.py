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
