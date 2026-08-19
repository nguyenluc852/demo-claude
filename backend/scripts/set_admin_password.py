"""Rotate the seed operator's password on an existing database.

`scripts.seed` only ever *creates* the operator — it skips one that already
exists, so it cannot rotate a password. This does that one job.

Reads the account from the environment, never from a literal here:

    SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... \
        backend/.venv/bin/python -m scripts.set_admin_password
"""

import asyncio

from app.common.security import hash_password
from app.core.config import settings
from app.core.constants import Collection, Field, Limits
from app.db import mongo


async def set_admin_password() -> None:
    password = settings.seed_admin_password
    if not password:
        raise SystemExit(
            "SEED_ADMIN_PASSWORD is not set. Put one in backend/.env "
            "(see .env.example) and run this again."
        )
    # The API enforces these on every other path; a script must not be the
    # hole that lets a 3-character password into the database.
    if not Limits.PASSWORD_MIN <= len(password) <= Limits.PASSWORD_MAX:
        raise SystemExit(
            f"SEED_ADMIN_PASSWORD must be between {Limits.PASSWORD_MIN} and "
            f"{Limits.PASSWORD_MAX} characters."
        )

    await mongo.connect()
    try:
        email = settings.seed_admin_email.lower()
        result = await mongo.get_collection(Collection.USERS).update_one(
            {Field.EMAIL: email},
            {"$set": {Field.PASSWORD_HASH: hash_password(password)}},
        )
        if result.matched_count == 0:
            raise SystemExit(
                f"No user with email {email}. Run `python -m scripts.seed` first, "
                "or check SEED_ADMIN_EMAIL."
            )
        # The new password is not echoed — it belongs to the operator's .env.
        print(f"password updated for {email}")
    finally:
        await mongo.close()


if __name__ == "__main__":
    asyncio.run(set_admin_password())
