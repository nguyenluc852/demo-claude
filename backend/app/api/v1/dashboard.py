from fastapi import APIRouter, Query

from app.common.deps import StaffDep
from app.common.schemas import DataResponse
from app.core.constants import Business, QueryParam, Route, Tag
from app.schemas.dashboard import DashboardSummary, RevenueSeries
from app.services.dashboard import dashboard_service

router = APIRouter(tags=[Tag.DASHBOARD])


@router.get(Route.DASHBOARD_SUMMARY, response_model=DataResponse[DashboardSummary])
async def summary(_: StaffDep) -> DataResponse[DashboardSummary]:
    return DataResponse(data=await dashboard_service.summary())


@router.get(Route.DASHBOARD_REVENUE, response_model=DataResponse[RevenueSeries])
async def revenue(
    _: StaffDep,
    months: int = Query(
        default=Business.REVENUE_MONTHS,
        ge=Business.QUARTER_MONTHS,
        le=Business.REVENUE_MONTHS,
        alias=QueryParam.MONTHS,
    ),
) -> DataResponse[RevenueSeries]:
    """`months` selects the window: 3 for the quarter, 12 for the rolling year."""
    return DataResponse(data=await dashboard_service.revenue(months))
