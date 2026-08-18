from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.common.validators import one_of
from app.core.constants import ContractStatus, Limits, PaymentCycle
from app.core.messages import ErrorMessage


class ContractBase(BaseModel):
    room_id: str
    tenant_name: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.NAME_MAX)
    tenant_id_card: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.ID_CARD_MAX)
    tenant_phone: str = Field(min_length=Limits.NAME_MIN, max_length=Limits.PHONE_MAX)
    tenant_email: EmailStr
    start_date: datetime
    end_date: datetime
    deposit: float = Field(ge=0, le=Limits.MONEY_MAX)
    payment_cycle: str = PaymentCycle.MONTHLY
    occupants: int = Field(default=1, ge=1)
    note: str | None = Field(default=None, max_length=Limits.TEXT_MAX)

    @field_validator("payment_cycle")
    @classmethod
    def _valid_cycle(cls, value: str) -> str:
        return one_of(value, PaymentCycle.ALL)

    @model_validator(mode="after")
    def _end_after_start(self) -> "ContractBase":
        if self.end_date <= self.start_date:
            raise ValueError(ErrorMessage.CONTRACT_END_BEFORE_START)
        return self


class ContractCreate(ContractBase):
    pass


class ContractUpdate(BaseModel):
    tenant_name: str | None = Field(
        default=None, min_length=Limits.NAME_MIN, max_length=Limits.NAME_MAX
    )
    tenant_id_card: str | None = Field(
        default=None, min_length=Limits.NAME_MIN, max_length=Limits.ID_CARD_MAX
    )
    tenant_phone: str | None = Field(
        default=None, min_length=Limits.NAME_MIN, max_length=Limits.PHONE_MAX
    )
    tenant_email: EmailStr | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    deposit: float | None = Field(default=None, ge=0, le=Limits.MONEY_MAX)
    payment_cycle: str | None = None
    occupants: int | None = Field(default=None, ge=1)
    note: str | None = Field(default=None, max_length=Limits.TEXT_MAX)
    status: str | None = None

    @field_validator("payment_cycle")
    @classmethod
    def _valid_cycle(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, PaymentCycle.ALL)

    @field_validator("status")
    @classmethod
    def _valid_status(cls, value: str | None) -> str | None:
        return None if value is None else one_of(value, ContractStatus.ALL)


class ContractSchema(ContractBase):
    id: str
    status: str
    email_verified: bool = False
    room_number: str | None = None
    created_at: datetime
