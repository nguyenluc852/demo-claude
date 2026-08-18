from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.common.validators import one_of
from app.core.constants import InvoiceStatus, Limits


class InvoiceLine(BaseModel):
    """A frozen copy of one charge.

    The unit price is snapshotted at issue time so editing master data later
    never rewrites the history of an already-issued invoice.
    """

    code: str
    name: str
    unit: str
    unit_price: float
    quantity: float
    amount: float
    meter_old: float | None = None
    meter_new: float | None = None


class InvoiceSchema(BaseModel):
    id: str
    room_id: str
    room_number: str | None = None
    contract_id: str
    tenant_name: str | None = None
    tenant_email: str | None = None
    period: str
    room_charge: float
    lines: list[InvoiceLine]
    total: float
    paid_amount: float
    status: str
    due_date: datetime
    sent_at: datetime | None
    created_at: datetime


class InvoicePayment(BaseModel):
    paid_amount: float = Field(ge=0, le=Limits.MONEY_MAX)


class InvoiceStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def _valid_status(cls, value: str) -> str:
        return one_of(value, InvoiceStatus.ALL)
