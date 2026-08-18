from fastapi import APIRouter

from app.common.schemas import DataResponse
from app.core.constants import AppMeta, Route, Tag
from app.core.messages import HealthStatus
from app.schemas.health import HealthSchema

router = APIRouter(tags=[Tag.HEALTH])


@router.get(Route.HEALTH, response_model=DataResponse[HealthSchema])
async def get_health() -> DataResponse[HealthSchema]:
    """Liveness probe used by the frontend and by the Docker healthcheck."""
    return DataResponse(data=HealthSchema(status=HealthStatus.OK, version=AppMeta.VERSION))
