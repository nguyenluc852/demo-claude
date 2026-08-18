import { API_ROUTES } from '../constants'
import type { DataResponse, PageResponse } from '../types/api'
import type { Health, Item, ItemCreate, ItemUpdate } from '../types/models'
import { apiClient } from './client'

export const healthApi = {
  get: () => apiClient.get<DataResponse<Health>>(API_ROUTES.health),
}

export const itemsApi = {
  list: () => apiClient.get<PageResponse<Item>>(API_ROUTES.items),
  create: (payload: ItemCreate) => apiClient.post<DataResponse<Item>>(API_ROUTES.items, payload),
  update: (id: number, payload: ItemUpdate) =>
    apiClient.patch<DataResponse<Item>>(API_ROUTES.itemDetail(id), payload),
  remove: (id: number) => apiClient.delete<void>(API_ROUTES.itemDetail(id)),
}
