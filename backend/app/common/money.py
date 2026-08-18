"""VND rounding.

The dong has no minor unit, so every amount the API stores or returns is a whole
number. Rounding once at the point each amount is produced keeps a total equal to
the sum of its rounded lines — rounding only the total would not.
"""

from decimal import ROUND_HALF_UP, Decimal

from app.core.constants import Business

_QUANTUM = Decimal(1).scaleb(-Business.MONEY_ROUNDING)


def to_vnd(amount: float | Decimal) -> float:
    return float(Decimal(str(amount)).quantize(_QUANTUM, rounding=ROUND_HALF_UP))
