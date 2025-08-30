export type KdfParams = {
  name: 'argon2id',
  salt_b64: string,
  m: number,
  t: number,
  p: number
}

export type VaultHeaderPayload = {
  v: 1
  app: 'pm.nostr.vault'
  createdAt: number
  updatedAt: number
  kdf: KdfParams
  hkdf: { info: 'item-subkeys-v1' }
  policy: { autolockSec: number, clipboardClearSec: number }
  relays: string[]
}

export type ItemBase = {
  id: string
  type: 'login'|'note'|'apiKey'|'card'|'identity'|'totp'
  title: string
  tags: string[]
  createdAt: number
  updatedAt: number
  version: number
  deleted?: boolean
}

export type LoginItem = ItemBase & {
  type: 'login'
  site: string
  username: string
  password: string
  url?: string
  notes?: string
}

export type Envelope = {
  v: 1
  alg: 'xchacha20poly1305'
  nonce: string     // base64
  salt: string      // base64 (itemSalt for subkey derivation)
  ad?: string
  kdf: KdfParams    // duplicated for recovery/bootstrap
  ct: string        // base64 ciphertext
}

export type NostrEvent = {
  id: string
  pubkey: string
  created_at: number
  kind: number
  tags: string[][]
  content: string
  sig: string
}
