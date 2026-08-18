from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_rooms: int
    available_rooms: int
    occupied_rooms: int
    maintenance_rooms: int
    overdue_rooms: int
    active_contracts: int
    expiring_contracts: int
    unpaid_invoices: int
    outstanding_amount: float
    current_month_revenue: float


class RevenuePoint(BaseModel):
    """One column of the revenue chart, split by income source."""

    period: str
    room_revenue: float
    service_revenue: float
    total_revenue: float
    collected: float


class RevenueSeries(BaseModel):
    points: list[RevenuePoint]
    total_revenue: float
    total_collected: float
