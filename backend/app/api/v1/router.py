"""Aggregates every v1 router. New feature routers are registered here only."""

from fastapi import APIRouter

from app.api.v1 import health, items
from app.core.constants import ApiPrefix

api_router = APIRouter(prefix=ApiPrefix.V1)

api_router.include_router(health.router)
api_router.include_router(items.router)
