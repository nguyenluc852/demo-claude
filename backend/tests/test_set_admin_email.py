"""Guardrails of `scripts.set_admin_email`.

The script is operator tooling that rewrites a row in place, so what matters is
not its output but what it refuses to do. Each case here drives the real
function against the suite's own database — `conftest` has already repointed
`settings.mongodb_db` at `<db>_test`, and every case asserts that redirect
still holds before touching anything.
"""

from typing import Any

import pytest

from app.core.config import settings
from app.core.constants import Collection, Field, UserRole
from app.db import mongo
from scripts.set_admin_email import set_admin_email

ADMIN_USERNAME = "script-admin"
OLD_EMAIL = "old.admin@motel.example.com"
NEW_EMAIL = "new.admin@motel.example.com"
OTHER_USERNAME = "script-other"

TEST_DB_SUFFIX = "_test"


def _insert_user(mongo_database: Any, username: str, email: str) -> Any:
    """Insert straight into Mongo: these accounts predate the API's rules."""
    result = mongo_database[Collection.USERS].insert_one(
        {
            Field.USERNAME: username,
            Field.EMAIL: email,
            Field.ROLE: UserRole.ADMIN,
        }
    )
    return result.inserted_id


def _email_of(mongo_database: Any, user_id: Any) -> str:
    document = mongo_database[Collection.USERS].find_one({Field.ID: user_id})
    assert document is not None
    email: str = document[Field.EMAIL]
    return email


@pytest.fixture(autouse=True)
def target_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    """Aim the script at the fixture account, never at whatever .env holds.

    The suffix check is the load-bearing part: the script writes, so a case
    that somehow ran against the dev database would corrupt it.
    """
    assert settings.mongodb_db.endswith(TEST_DB_SUFFIX), settings.mongodb_db
    monkeypatch.setattr(settings, "seed_admin_username", ADMIN_USERNAME)
    monkeypatch.setattr(settings, "seed_admin_email", NEW_EMAIL)


async def test_rewrites_the_email_of_the_matching_account(mongo_database: Any) -> None:
    user_id = _insert_user(mongo_database, ADMIN_USERNAME, OLD_EMAIL)

    await set_admin_email()

    assert _email_of(mongo_database, user_id) == NEW_EMAIL


async def test_lowercases_the_target_email(
    mongo_database: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    """The account is looked up by email elsewhere, so casing cannot drift."""
    monkeypatch.setattr(settings, "seed_admin_email", NEW_EMAIL.upper())
    user_id = _insert_user(mongo_database, ADMIN_USERNAME, OLD_EMAIL)

    await set_admin_email()

    assert _email_of(mongo_database, user_id) == NEW_EMAIL


async def test_refuses_when_no_account_carries_the_username(mongo_database: Any) -> None:
    other_id = _insert_user(mongo_database, OTHER_USERNAME, OLD_EMAIL)

    with pytest.raises(SystemExit):
        await set_admin_email()

    assert _email_of(mongo_database, other_id) == OLD_EMAIL


async def test_is_a_no_op_when_the_email_already_matches(mongo_database: Any) -> None:
    """Locks the end state, not the wording: an account already on the target
    email survives the run untouched and raises nothing, so the script stays
    safe to re-run.
    """
    user_id = _insert_user(mongo_database, ADMIN_USERNAME, NEW_EMAIL)

    await set_admin_email()

    assert _email_of(mongo_database, user_id) == NEW_EMAIL


async def test_refuses_when_the_target_email_belongs_to_another_account(
    mongo_database: Any,
) -> None:
    """Email is unique-indexed, so the write would fail anyway — it must not
    get as far as attempting it, and it must leave both rows alone."""
    admin_id = _insert_user(mongo_database, ADMIN_USERNAME, OLD_EMAIL)
    other_id = _insert_user(mongo_database, OTHER_USERNAME, NEW_EMAIL)

    with pytest.raises(SystemExit):
        await set_admin_email()

    assert _email_of(mongo_database, admin_id) == OLD_EMAIL
    assert _email_of(mongo_database, other_id) == NEW_EMAIL


async def test_refuses_to_guess_between_duplicate_usernames(mongo_database: Any) -> None:
    """Two accounts under one username only exist on a database predating the
    unique index on `username`. Reaching that state here means connecting
    first, because `mongo.connect()` rebuilds the index and would fail on the
    duplicates before the script's own check ever ran.
    """
    await mongo.connect()
    try:
        mongo_database[Collection.USERS].drop_index(f"{Field.USERNAME}_1")
        first_id = _insert_user(mongo_database, ADMIN_USERNAME, OLD_EMAIL)
        second_id = _insert_user(mongo_database, ADMIN_USERNAME, f"second.{OLD_EMAIL}")

        with pytest.raises(SystemExit):
            await set_admin_email()

        assert _email_of(mongo_database, first_id) == OLD_EMAIL
        assert _email_of(mongo_database, second_id) == f"second.{OLD_EMAIL}"
    finally:
        mongo_database[Collection.USERS].delete_many({Field.USERNAME: ADMIN_USERNAME})
        await mongo.close()
