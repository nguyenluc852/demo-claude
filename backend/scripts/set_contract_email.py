"""Point a room's live contract at a different tenant email.

The demo data ships `@example.com` addresses, which a mail provider in test mode
refuses outright — so no invoice can reach them. This swaps one in for a real
mailbox without hand-editing the database.

    MONGODB_URL=... CONTRACT_ROOM=301 CONTRACT_EMAIL=someone@gmail.com \
        backend/.venv/bin/python -m scripts.set_contract_email

Delegates to `contract_service.update()` rather than writing the field itself,
so the rule the API already enforces still holds: a changed address is unproven
until its owner clicks the link, and a fresh verification email goes out. With
no mail credential configured that email is only logged — the tenant then cannot
sign in to the portal until it is sent for real, though invoices still reach the
new address.
"""

import asyncio
import os

from app.core.constants import Collection, ContractStatus, Field
from app.db import mongo
from app.schemas.contract import ContractUpdate
from app.services.contract import contract_service

ROOM_VAR = "CONTRACT_ROOM"
EMAIL_VAR = "CONTRACT_EMAIL"


async def set_contract_email() -> None:
    room_number = os.environ.get(ROOM_VAR, "").strip()
    email = os.environ.get(EMAIL_VAR, "").strip()

    if not room_number or not email:
        raise SystemExit(f"Set both {ROOM_VAR} and {EMAIL_VAR}.")

    await mongo.connect()
    try:
        room = await mongo.get_collection(Collection.ROOMS).find_one(
            {Field.ROOM_NUMBER: room_number}
        )
        if room is None:
            raise SystemExit(f"No room numbered {room_number!r}.")

        contracts = mongo.get_collection(Collection.CONTRACTS)
        # A terminated contract is history; rewriting its address would mail
        # someone who has already moved out.
        query = {
            Field.ROOM_ID: str(room[Field.ID]),
            Field.STATUS: {"$ne": ContractStatus.TERMINATED},
        }

        # Refuse to guess, the same way set_admin_email does.
        matches = await contracts.count_documents(query)
        if matches == 0:
            raise SystemExit(f"Room {room_number} has no live contract.")
        if matches > 1:
            raise SystemExit(f"Room {room_number} has {matches} live contracts; refusing to guess.")

        current = await contracts.find_one(query)
        if current is None:
            raise SystemExit(f"Room {room_number} has no live contract.")
        previous = str(current["tenant_email"])
        if previous.lower() == email.lower():
            print(f"already {email}; nothing to do")
            return

        updated = await contract_service.update(
            str(current[Field.ID]), ContractUpdate(tenant_email=email)
        )
        print(f"room {room_number}: {previous} -> {updated.tenant_email}")
        print("verification reset; a new link was sent (or logged, with no mail credential)")
    finally:
        await mongo.close()


if __name__ == "__main__":
    asyncio.run(set_contract_email())
