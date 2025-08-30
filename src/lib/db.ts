import Dexie, { Table } from 'dexie'

export interface StoredEvent {
  id: string
  d: string
  created_at: number
  content: string
  raw: any
}

export interface ItemIndex {
  d: string
  version: number
  updatedAt: number
  type: string
  title?: string
}

export class VaultDB extends Dexie {
  events!: Table<StoredEvent, string> // id
  index!: Table<ItemIndex, string>    // d

  constructor() {
    super('nostr_pm_db')
    this.version(1).stores({
      events: 'id, d, created_at',
      index: 'd, updatedAt, version'
    })
  }
}

export const db = new VaultDB()
