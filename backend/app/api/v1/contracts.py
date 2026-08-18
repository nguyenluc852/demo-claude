from fastapi import APIRouter, Query, status

from app.common.deps import PaginationDep, StaffDep
from app.common.schemas import DataResponse, PageMeta, PageResponse
from app.core.constants import QueryParam, Route, Tag
from app.schemas.contract import ContractCreate, ContractSchema, ContractUpdate
from app.services.contract import contract_service

router = APIRouter(tags=[Tag.CONTRACTS])


@router.get(Route.CONTRACTS, response_model=PageResponse[ContractSchema])
async def list_contracts(
    pagination: PaginationDep,
    _: StaffDep,
    status_filter: str | None = Query(default=None, alias=QueryParam.STATUS),
) -> PageResponse[ContractSchema]:
    contracts, total = await contract_service.list(
        pagination.offset, pagination.size, status_filter
    )
    return PageResponse(
        data=contracts,
        meta=PageMeta(page=pagination.page, size=pagination.size, total=total),
    )


@router.get(Route.CONTRACT_DETAIL, response_model=DataResponse[ContractSchema])
async def get_contract(contract_id: str, _: StaffDep) -> DataResponse[ContractSchema]:
    return DataResponse(data=await contract_service.get(contract_id))


@router.post(
    Route.CONTRACTS,
    response_model=DataResponse[ContractSchema],
    status_code=status.HTTP_201_CREATED,
)
async def create_contract(
    payload: ContractCreate, _: StaffDep
) -> DataResponse[ContractSchema]:
    return DataResponse(data=await contract_service.create(payload))


@router.patch(Route.CONTRACT_DETAIL, response_model=DataResponse[ContractSchema])
async def update_contract(
    contract_id: str, payload: ContractUpdate, _: StaffDep
) -> DataResponse[ContractSchema]:
    return DataResponse(data=await contract_service.update(contract_id, payload))


@router.delete(Route.CONTRACT_DETAIL, status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(contract_id: str, _: StaffDep) -> None:
    await contract_service.delete(contract_id)
