from datetime import datetime

from pydantic import BaseModel, Field

from app.core.constants import Limits


class MeterReadingSchema(BaseModel):
    id: str
    room_id: str
    contract_id: str
    period: str
    electric_old: float
    electric_new: float | None
    water_old: float
    water_new: float | None
    recorded_at: datetime


class MeterReadingSave(BaseModel):
    """One room's readings for one period. Both meters post together."""

    period: str
    electric_new: float | None = Field(default=None, ge=0, le=Limits.METER_MAX)
    water_new: float | None = Field(default=None, ge=0, le=Limits.METER_MAX)


class MeterRow(BaseModel):
    """A single line of the high-density meter grid."""

    room_id: str
    room_number: str
    floor: int
    contract_id: str | None
    tenant_name: str | None
    period: str
    electric_old: float
    electric_new: float | None
    water_old: float
    water_new: float | None
    invoice_id: str | None = None
