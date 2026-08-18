import { API_ROUTES, QUERY_PARAM } from '../constants'
import type { DataResponse, PageResponse } from '../types/api'
import type {
  ApiMessage,
  Contract,
  ContractInput,
  ContractUpdate,
  DashboardSummary,
  Health,
  Invoice,
  Lead,
  LeadInput,
  LoginRequest,
  MeterRow,
  MeterSave,
  PublicRoom,
  RegisterRequest,
  RevenueSeries,
  Room,
  RoomGridItem,
  RoomInput,
  ServiceInput,
  ServicePrice,
  ServiceUpdate,
  TenantOverview,
  TokenPayload,
  User,
  UserUpdate,
} from '../types/models'
import { apiClient } from './client'

/** Drops empty filters so the backend never receives `?status=`. */
function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value))
    }
  }
  const serialized = query.toString()
  return serialized ? `${path}?${serialized}` : path
}

export const healthApi = {
  get: () => apiClient.get<DataResponse<Health>>(API_ROUTES.health),
}

export const authApi = {
  login: (payload: LoginRequest) =>
    apiClient.post<DataResponse<TokenPayload>>(API_ROUTES.authLogin, payload),
  register: (payload: RegisterRequest) =>
    apiClient.post<DataResponse<TokenPayload>>(API_ROUTES.authRegister, payload),
  me: () => apiClient.get<DataResponse<User>>(API_ROUTES.authMe),
  verify: (token: string) =>
    apiClient.post<DataResponse<ApiMessage>>(
      withQuery(API_ROUTES.authVerify, { [QUERY_PARAM.token]: token }),
    ),
  resendVerification: (email: string) =>
    apiClient.post<DataResponse<ApiMessage>>(API_ROUTES.authResendVerification, { email }),
}

export const usersApi = {
  list: () => apiClient.get<PageResponse<User>>(API_ROUTES.users),
  update: (id: string, payload: UserUpdate) =>
    apiClient.patch<DataResponse<User>>(API_ROUTES.userDetail(id), payload),
  remove: (id: string) => apiClient.delete<void>(API_ROUTES.userDetail(id)),
}

export const roomsApi = {
  list: (search?: string, status?: string) =>
    apiClient.get<PageResponse<Room>>(
      withQuery(API_ROUTES.rooms, {
        [QUERY_PARAM.search]: search,
        [QUERY_PARAM.status]: status,
      }),
    ),
  grid: () => apiClient.get<PageResponse<RoomGridItem>>(API_ROUTES.roomsGrid),
  create: (payload: RoomInput) =>
    apiClient.post<DataResponse<Room>>(API_ROUTES.rooms, payload),
  update: (id: string, payload: Partial<RoomInput>) =>
    apiClient.patch<DataResponse<Room>>(API_ROUTES.roomDetail(id), payload),
  remove: (id: string) => apiClient.delete<void>(API_ROUTES.roomDetail(id)),
}

export const contractsApi = {
  list: (status?: string) =>
    apiClient.get<PageResponse<Contract>>(
      withQuery(API_ROUTES.contracts, { [QUERY_PARAM.status]: status }),
    ),
  create: (payload: ContractInput) =>
    apiClient.post<DataResponse<Contract>>(API_ROUTES.contracts, payload),
  update: (id: string, payload: ContractUpdate) =>
    apiClient.patch<DataResponse<Contract>>(API_ROUTES.contractDetail(id), payload),
  remove: (id: string) => apiClient.delete<void>(API_ROUTES.contractDetail(id)),
}

export const metersApi = {
  grid: (period?: string, filter?: string, search?: string) =>
    apiClient.get<PageResponse<MeterRow>>(
      withQuery(API_ROUTES.meters, {
        [QUERY_PARAM.period]: period,
        [QUERY_PARAM.filter]: filter,
        [QUERY_PARAM.search]: search,
      }),
    ),
  save: (roomId: string, payload: MeterSave) =>
    apiClient.put<DataResponse<MeterRow>>(API_ROUTES.meterDetail(roomId), payload),
}

export const invoicesApi = {
  list: (status?: string, period?: string) =>
    apiClient.get<PageResponse<Invoice>>(
      withQuery(API_ROUTES.invoices, {
        [QUERY_PARAM.status]: status,
        [QUERY_PARAM.period]: period,
      }),
    ),
  send: (id: string) =>
    apiClient.post<DataResponse<Invoice>>(API_ROUTES.invoiceSend(id)),
  recordPayment: (id: string, paidAmount: number) =>
    apiClient.patch<DataResponse<Invoice>>(API_ROUTES.invoicePayment(id), {
      paid_amount: paidAmount,
    }),
  pdf: (id: string) => apiClient.blob(API_ROUTES.invoicePdf(id)),
}

export const servicesApi = {
  list: () => apiClient.get<PageResponse<ServicePrice>>(API_ROUTES.services),
  create: (payload: ServiceInput) =>
    apiClient.post<DataResponse<ServicePrice>>(API_ROUTES.services, payload),
  update: (id: string, payload: ServiceUpdate) =>
    apiClient.patch<DataResponse<ServicePrice>>(API_ROUTES.serviceDetail(id), payload),
  remove: (id: string) => apiClient.delete<void>(API_ROUTES.serviceDetail(id)),
}

export const leadsApi = {
  list: () => apiClient.get<PageResponse<Lead>>(API_ROUTES.leads),
  update: (id: string, status: string) =>
    apiClient.patch<DataResponse<Lead>>(API_ROUTES.leadDetail(id), { status }),
  remove: (id: string) => apiClient.delete<void>(API_ROUTES.leadDetail(id)),
}

export const dashboardApi = {
  summary: () => apiClient.get<DataResponse<DashboardSummary>>(API_ROUTES.dashboardSummary),
  revenue: (months: number) =>
    apiClient.get<DataResponse<RevenueSeries>>(
      withQuery(API_ROUTES.dashboardRevenue, { [QUERY_PARAM.months]: months }),
    ),
}

export const publicApi = {
  rooms: () => apiClient.get<PageResponse<PublicRoom>>(API_ROUTES.publicRooms),
  submitLead: (payload: LeadInput) =>
    apiClient.post<DataResponse<ApiMessage>>(API_ROUTES.publicLeads, payload),
}

export const tenantApi = {
  overview: () => apiClient.get<DataResponse<TenantOverview>>(API_ROUTES.tenantMe),
  invoices: () => apiClient.get<PageResponse<Invoice>>(API_ROUTES.tenantInvoices),
}
