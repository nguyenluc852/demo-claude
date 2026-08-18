"""Aggregates behind the admin dashboard: occupancy counters and the revenue chart."""

from app.common.money import to_vnd
from app.common.periods import current_period, recent_periods
from app.core.constants import (
    Business,
    Collection,
    ContractStatus,
    Field,
    InvoiceStatus,
    RoomStatus,
)
from app.db.mongo import get_collection
from app.schemas.dashboard import DashboardSummary, RevenuePoint, RevenueSeries
from app.services.contract import derive_status

_UNSETTLED = (InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.UNPAID,
              InvoiceStatus.PARTIALLY_PAID)


class DashboardService:
    async def summary(self) -> DashboardSummary:
        rooms = get_collection(Collection.ROOMS)
        contracts = get_collection(Collection.CONTRACTS)
        invoices = get_collection(Collection.INVOICES)

        total_rooms: int = await rooms.count_documents({})
        counts: dict[str, int] = {}
        for status in RoomStatus.ALL:
            counts[status] = await rooms.count_documents({Field.STATUS: status})

        active = 0
        expiring = 0
        async for contract in contracts.find({Field.STATUS: {"$ne": ContractStatus.TERMINATED}}):
            status = derive_status(str(contract[Field.STATUS]), contract["end_date"])
            if status == ContractStatus.EXPIRING:
                expiring += 1
            if status in (ContractStatus.ACTIVE, ContractStatus.EXPIRING, ContractStatus.OVERDUE):
                active += 1

        unpaid = 0
        outstanding = 0.0
        async for invoice in invoices.find({Field.STATUS: {"$in": _UNSETTLED}}):
            unpaid += 1
            outstanding += float(invoice.get(Field.TOTAL, 0)) - float(
                invoice.get(Field.PAID_AMOUNT, 0)
            )

        month_revenue = 0.0
        async for invoice in invoices.find({Field.PERIOD: current_period()}):
            month_revenue += float(invoice.get(Field.TOTAL, 0))

        return DashboardSummary(
            total_rooms=total_rooms,
            available_rooms=counts.get(RoomStatus.AVAILABLE, 0),
            occupied_rooms=counts.get(RoomStatus.OCCUPIED, 0),
            maintenance_rooms=counts.get(RoomStatus.MAINTENANCE, 0),
            overdue_rooms=counts.get(RoomStatus.OVERDUE, 0),
            active_contracts=active,
            expiring_contracts=expiring,
            unpaid_invoices=unpaid,
            outstanding_amount=to_vnd(outstanding),
            current_month_revenue=to_vnd(month_revenue),
        )

    async def revenue(self, months: int = Business.REVENUE_MONTHS) -> RevenueSeries:
        """Rent and service income per period, split so the chart can stack them."""
        periods = recent_periods(months)
        buckets: dict[str, dict[str, float]] = {
            period: {"room": 0.0, "service": 0.0, "collected": 0.0} for period in periods
        }

        invoices = get_collection(Collection.INVOICES)
        cursor = invoices.find({Field.PERIOD: {"$in": periods}})
        async for invoice in cursor:
            bucket = buckets[str(invoice[Field.PERIOD])]
            room_charge = float(invoice.get("room_charge", 0))
            total = float(invoice.get(Field.TOTAL, 0))
            bucket["room"] += room_charge
            bucket["service"] += total - room_charge
            bucket["collected"] += float(invoice.get(Field.PAID_AMOUNT, 0))

        points = [
            RevenuePoint(
                period=period,
                room_revenue=to_vnd(values["room"]),
                service_revenue=to_vnd(values["service"]),
                total_revenue=to_vnd(values["room"] + values["service"]),
                collected=to_vnd(values["collected"]),
            )
            for period, values in ((p, buckets[p]) for p in periods)
        ]
        return RevenueSeries(
            points=points,
            total_revenue=to_vnd(sum(point.total_revenue for point in points)),
            total_collected=to_vnd(sum(point.collected for point in points)),
        )


dashboard_service = DashboardService()
