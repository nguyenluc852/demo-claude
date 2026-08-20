from datetime import datetime

from pydantic import BaseModel

from app.schemas.contract import ContractSchema
from app.schemas.room import RoomSchema


class TenantBalance(BaseModel):
    """What the tenant still owes, summed across every issued invoice.

    Split into the newest period and everything older because a partial payment
    leaves a remainder behind: without the split, an old half-paid invoice would
    silently inflate what looks like this month's bill.
    """

    outstanding: float
    current_due: float
    previous_due: float
    current_period: str | None = None
    due_date: datetime | None = None
    unpaid_count: int


class TenantOverview(BaseModel):
    """Everything the tenant portal shows above the invoice history."""

    contract: ContractSchema
    room: RoomSchema
    balance: TenantBalance
