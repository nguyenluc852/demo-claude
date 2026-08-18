/** Mirrors the Pydantic schemas in backend/app/schemas/, field for field. */

export interface Health {
  status: string
  version: string
}

export interface User {
  id: string
  username: string
  email: string
  role: string
  email_verified: boolean
  phone: string | null
  contract_id: string | null
  created_at: string
}

export interface UserUpdate {
  role?: string
  email_verified?: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface TokenPayload {
  access_token: string
  token_type: string
  user: User
}

export interface ApiMessage {
  message: string
}

export interface Room {
  id: string
  room_number: string
  floor: number
  room_type: string
  area: number
  base_price: number
  amenities: string[]
  images: string[]
  description: string | null
  status: string
  created_at: string
}

export interface RoomOccupancy {
  tenant_name: string | null
  contract_id: string | null
  contract_end: string | null
}

export interface RoomGridItem extends Room {
  occupancy: RoomOccupancy
}

export interface PublicRoom {
  id: string
  room_number: string
  floor: number
  room_type: string
  area: number
  base_price: number
  amenities: string[]
  images: string[]
  description: string | null
  status: string
}

export interface RoomInput {
  room_number: string
  floor: number
  room_type: string
  area: number
  base_price: number
  amenities: string[]
  images: string[]
  description?: string | null
  status?: string
}

export interface Contract {
  id: string
  room_id: string
  room_number: string | null
  tenant_name: string
  tenant_id_card: string
  tenant_phone: string
  tenant_email: string
  start_date: string
  end_date: string
  deposit: number
  payment_cycle: string
  occupants: number
  note: string | null
  status: string
  email_verified: boolean
  created_at: string
}

export interface ContractInput {
  room_id: string
  tenant_name: string
  tenant_id_card: string
  tenant_phone: string
  tenant_email: string
  start_date: string
  end_date: string
  deposit: number
  payment_cycle: string
  occupants: number
  note?: string | null
}

export type ContractUpdate = Partial<Omit<ContractInput, 'room_id'>> & { status?: string }

export interface MeterRow {
  room_id: string
  room_number: string
  floor: number
  contract_id: string | null
  tenant_name: string | null
  period: string
  electric_old: number
  electric_new: number | null
  water_old: number
  water_new: number | null
  invoice_id: string | null
}

export interface MeterSave {
  period: string
  electric_new: number | null
  water_new: number | null
}

export interface InvoiceLine {
  code: string
  name: string
  unit: string
  unit_price: number
  quantity: number
  amount: number
  meter_old: number | null
  meter_new: number | null
}

export interface Invoice {
  id: string
  room_id: string
  room_number: string | null
  contract_id: string
  tenant_name: string | null
  tenant_email: string | null
  period: string
  room_charge: number
  lines: InvoiceLine[]
  total: number
  paid_amount: number
  status: string
  due_date: string
  sent_at: string | null
  created_at: string
}

export interface ServicePrice {
  id: string
  code: string
  name: string
  unit_price: number
  unit: string
  category: string
  active: boolean
  created_at: string
}

export interface ServiceInput {
  code: string
  name: string
  unit_price: number
  unit: string
  category: string
  active: boolean
}

export type ServiceUpdate = Partial<Omit<ServiceInput, 'code'>>

export interface Lead {
  id: string
  name: string
  phone: string
  email: string | null
  message: string | null
  room_id: string | null
  room_number: string | null
  status: string
  created_at: string
}

export interface LeadInput {
  name: string
  phone: string
  email?: string | null
  message?: string | null
  room_id?: string | null
}

export interface DashboardSummary {
  total_rooms: number
  available_rooms: number
  occupied_rooms: number
  maintenance_rooms: number
  overdue_rooms: number
  active_contracts: number
  expiring_contracts: number
  unpaid_invoices: number
  outstanding_amount: number
  current_month_revenue: number
}

export interface RevenuePoint {
  period: string
  room_revenue: number
  service_revenue: number
  total_revenue: number
  collected: number
}

export interface RevenueSeries {
  points: RevenuePoint[]
  total_revenue: number
  total_collected: number
}

export interface TenantOverview {
  contract: Contract
  room: Room
}
