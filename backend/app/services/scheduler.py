"""Monthly dispatch of draft invoices.

Started and stopped by the FastAPI lifespan so a reload does not leave a second
scheduler running against the same database.
"""

import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.services.invoice import invoice_service

logger = logging.getLogger(__name__)

_JOB_ID = "monthly-invoice-dispatch"
_scheduler: AsyncIOScheduler | None = None


async def dispatch_pending_invoices() -> None:
    result = await invoice_service.send_pending()
    logger.info(
        "Monthly invoice dispatch sent %s invoice(s), %s failed",
        result.sent,
        result.failed,
    )


def start() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = AsyncIOScheduler()
    _scheduler.add_job(
        dispatch_pending_invoices,
        CronTrigger(day=settings.invoice_cron_day, hour=settings.invoice_cron_hour),
        id=_JOB_ID,
        replace_existing=True,
    )
    _scheduler.start()
    logger.info(
        "Invoice scheduler started: day %s at %s:00",
        settings.invoice_cron_day,
        settings.invoice_cron_hour,
    )


def shutdown() -> None:
    global _scheduler
    if _scheduler is None:
        return
    _scheduler.shutdown(wait=False)
    _scheduler = None
