"""The mailer: logging fallback, the HTTP call it makes, and how failure surfaces.

Nothing here touches the network. The transport is swapped for a stub so the
suite can assert on what would have been sent.
"""

import json
from collections.abc import Iterator
from typing import Any

import httpx
import pytest

from app.common.exceptions import EmailDeliveryError
from app.core.config import settings
from app.core.constants import AuthScheme, Header, Resend
from app.services.email import send_email

TO = "tenant@example.com"
SUBJECT = "Hóa đơn tháng"
BODY = "<p>xin chào</p>"
# Fixture-only, never sent anywhere: the transport below is a stub.
API_KEY = "pytest-fixture-only"
FROM = "no-reply@pytest.invalid"


@pytest.fixture
def api_key() -> Iterator[None]:
    """Turn the mailer on for one test, then put the suite back in log mode."""
    settings.resend_api_key = API_KEY
    settings.email_from = FROM
    yield
    settings.resend_api_key = ""
    settings.email_from = ""


def _transport(handler: Any) -> Any:
    """Replace the client's transport, leaving the rest of send_email intact."""
    original = httpx.AsyncClient.__init__

    def patched(self: Any, *args: Any, **kwargs: Any) -> None:
        kwargs["transport"] = httpx.MockTransport(handler)
        original(self, *args, **kwargs)

    return patched


async def test_no_api_key_logs_instead_of_sending(monkeypatch: Any) -> None:
    """The default path on a dev machine: no credential, no network call."""

    def explode(*_: Any, **__: Any) -> None:
        raise AssertionError("send_email must not open a client without a credential")

    monkeypatch.setattr(httpx.AsyncClient, "__init__", explode)
    await send_email(TO, SUBJECT, BODY)


async def test_a_key_without_a_sender_address_does_not_send(monkeypatch: Any) -> None:
    """Half-configured is not configured: the provider would reject every message."""
    settings.resend_api_key = API_KEY
    # A developer's own .env may carry EMAIL_FROM; this case is about its absence.
    settings.email_from = ""
    try:

        def explode(*_: Any, **__: Any) -> None:
            raise AssertionError("send_email must not open a client without EMAIL_FROM")

        monkeypatch.setattr(httpx.AsyncClient, "__init__", explode)
        await send_email(TO, SUBJECT, BODY)
    finally:
        settings.resend_api_key = ""


async def test_sends_the_message_with_a_bearer_key(monkeypatch: Any, api_key: None) -> None:
    seen: dict[str, Any] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        seen["url"] = str(request.url)
        seen["auth"] = request.headers[Header.AUTHORIZATION]
        seen["json"] = json.loads(request.content)
        return httpx.Response(200, json={"id": "msg_1"})

    monkeypatch.setattr(httpx.AsyncClient, "__init__", _transport(handler))
    await send_email(TO, SUBJECT, BODY)

    assert seen["url"] == Resend.API_URL
    assert seen["auth"] == f"{AuthScheme.BEARER} {API_KEY}"
    assert seen["json"][Resend.FIELD_TO] == [TO]
    assert seen["json"][Resend.FIELD_SUBJECT] == SUBJECT
    assert seen["json"][Resend.FIELD_HTML] == BODY
    assert seen["json"][Resend.FIELD_FROM] == settings.email_from


async def test_rejected_message_raises_delivery_error(monkeypatch: Any, api_key: None) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(422, json={"message": "domain not verified"})

    monkeypatch.setattr(httpx.AsyncClient, "__init__", _transport(handler))
    with pytest.raises(EmailDeliveryError):
        await send_email(TO, SUBJECT, BODY)


async def test_unreachable_provider_raises_delivery_error(monkeypatch: Any, api_key: None) -> None:
    """A timeout must become the same typed error, not leak httpx upward."""

    def handler(_: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timed out")

    monkeypatch.setattr(httpx.AsyncClient, "__init__", _transport(handler))
    with pytest.raises(EmailDeliveryError):
        await send_email(TO, SUBJECT, BODY)
