"""Billing periods are `YYYY-MM` strings — the natural key for a monthly cycle."""

from datetime import date, datetime

from app.core.constants import Business


def format_period(moment: date | datetime) -> str:
    return moment.strftime(Business.PERIOD_FORMAT)


def current_period() -> str:
    return format_period(datetime.now())


def parse_period(period: str) -> date:
    return datetime.strptime(period, Business.PERIOD_FORMAT).date()


def shift_period(period: str, months: int) -> str:
    """Move a period by whole months, wrapping the year as needed."""
    anchor = parse_period(period)
    total = anchor.year * Business.MONTHS_IN_YEAR + (anchor.month - 1) + months
    year, month = divmod(total, Business.MONTHS_IN_YEAR)
    return format_period(date(year, month + 1, 1))


def previous_period(period: str) -> str:
    return shift_period(period, -1)


def recent_periods(count: int, end: str | None = None) -> list[str]:
    """The `count` periods ending at `end` (default: this month), oldest first."""
    last = end or current_period()
    return [shift_period(last, offset) for offset in range(-(count - 1), 1)]
