"""Point the operator account at the configured email.

The dev database was created before `SEED_ADMIN_EMAIL` existed, so its admin
can carry an address that no longer matches settings. This reconciles them.

Identifies the account by `SEED_ADMIN_USERNAME` and rewrites its email to
`SEED_ADMIN_EMAIL` — both from the environment, never literals here:

    MONGODB_URL=... SEED_ADMIN_EMAIL=... \
        backend/.venv/bin/python -m scripts.set_admin_email

Run it against a remote database by setting MONGODB_URL for that database.
"""

import asyncio

from app.core.config import settings
from app.core.constants import Collection, Field
from app.db import mongo


async def set_admin_email() -> None:
    username = settings.seed_admin_username
    target = settings.seed_admin_email.lower()

    await mongo.connect()
    try:
        users = mongo.get_collection(Collection.USERS)
        print(f"database: {settings.mongodb_db}")

        # The lookup is its own existence check, so there is no window between
        # proving the account exists and reading it.
        current = await users.find_one({Field.USERNAME: username})
        if current is None:
            raise SystemExit(f"No user with username {username!r}.")

        # Refuse to guess. More than one account under this username means the
        # caller has to say which one, not that we pick.
        matches = await users.count_documents({Field.USERNAME: username})
        if matches > 1:
            raise SystemExit(f"{matches} users share username {username!r}; refusing to guess.")

        if current.get(Field.EMAIL) == target:
            print(f"already {target}; nothing to do")
            return

        # Email is unique-indexed: a collision would surface as a write error,
        # so name it plainly instead.
        clash = await users.find_one({Field.EMAIL: target})
        if clash is not None and clash[Field.ID] != current[Field.ID]:
            raise SystemExit(f"{target} already belongs to another account.")

        await users.update_one(
            {Field.ID: current[Field.ID]}, {"$set": {Field.EMAIL: target}}
        )
        print(f"email changed: {current.get(Field.EMAIL)} -> {target}")
    finally:
        await mongo.close()


if __name__ == "__main__":
    asyncio.run(set_admin_email())
