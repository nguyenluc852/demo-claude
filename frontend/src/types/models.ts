export interface Health {
  status: string
  version: string
}

export interface Item {
  id: number
  name: string
  description: string | null
}

export interface ItemCreate {
  name: string
  description?: string | null
}

export interface ItemUpdate {
  name?: string
  description?: string | null
}
