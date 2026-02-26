export type Id = string

export interface Note {
  id: Id
  leadId: Id
  content: string
  createdAt: string
  is_deleted?: boolean
  is_edited?: boolean
  original_content?: string
}

export interface Lead {
  id: string
  title: string
  contactName: string
  whatsapp: string
  columnId: Id
  createdAt: string
  order_index?: number
}

export interface Column {
  id: Id
  title: string
  color: string
  order_index?: number
}
