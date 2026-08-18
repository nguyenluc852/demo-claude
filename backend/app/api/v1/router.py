"""Aggregates every v1 router. New feature routers are registered here only."""

from fastapi import APIRouter

from app.api.v1 import (
    auth,
    contracts,
    dashboard,
    health,
    invoices,
    items,
    leads,
    meters,
    public,
    rooms,
    services,
    tenant,
    users,
)
from app.core.constants import ApiPrefix

api_router = APIRouter(prefix=ApiPrefix.V1)

api_router.include_router(health.router)
api_router.include_router(items.router)
api_router.include_router(auth.router)
api_router.include_router(public.router)
api_router.include_router(tenant.router)
api_router.include_router(users.router)
api_router.include_router(rooms.router)
api_router.include_router(contracts.router)
api_router.include_router(meters.router)
api_router.include_router(invoices.router)
api_router.include_router(services.router)
api_router.include_router(leads.router)
api_router.include_router(dashboard.router)
