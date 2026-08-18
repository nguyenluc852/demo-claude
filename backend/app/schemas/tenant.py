from pydantic import BaseModel

from app.schemas.contract import ContractSchema
from app.schemas.room import RoomSchema


class TenantOverview(BaseModel):
    """Everything the tenant portal shows above the invoice history."""

    contract: ContractSchema
    room: RoomSchema
