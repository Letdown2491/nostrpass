import sodium from 'libsodium-wrappers'
import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import { utf8ToBytes } from '@noble/hashes/utils'
import { argon2id } from 'hash-wasm'
import type { Envelope, KdfParams } from './types'

export async function initSodium() {
  if ((sodium as any)._sodium_initialized) return
  await sodium.ready
  ;(sodium as any)._sodium_initialized = true
}

export function randomBytes(len: number): Uint8Array {
  return sodium.randombytes_buf(len)
}

export function toB64(u8: Uint8Array): string {
  return sodium.to_base64(u8, sodium.base64_variants.ORIGINAL)
}

export function fromB64(b: string): Uint8Array {
  return sodium.from_base64(b, sodium.base64_variants.ORIGINAL)
}

export async function deriveVaultKey(passphrase: string, kdf: KdfParams): Promise<Uint8Array> {
  const salt = fromB64(kdf.salt_b64)
  const key = await argon2id({
    password: passphrase,
    salt,                // Uint8Array
    parallelism: kdf.p,  // threads
    iterations: kdf.t,   // time cost
    memorySize: kdf.m,   // KiB
    hashLength: 32,
    outputType: 'binary' // Uint8Array
  })
  return key as Uint8Array
}

export function deriveItemKey(vaultKey: Uint8Array, itemSalt_b64: string): Uint8Array {
  const salt = fromB64(itemSalt_b64)
  const info = utf8ToBytes('item-subkeys-v1')
  return hkdf(sha256, vaultKey, salt, info, 32)
}

export async function encryptEnvelope(plaintextObj: any, vaultKey: Uint8Array, kdf: KdfParams): Promise<Envelope> {
  await initSodium()
  const nonce = randomBytes(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES)
  const itemSalt = randomBytes(16)
  const itemKey = deriveItemKey(vaultKey, toB64(itemSalt))

  const ad = 'pm.nostr.v1'
  const pt = new TextEncoder().encode(JSON.stringify(plaintextObj))
  const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(pt, new TextEncoder().encode(ad), null, nonce, itemKey)
  return {
    v: 1,
    alg: 'xchacha20poly1305',
    nonce: toB64(nonce),
    salt: toB64(itemSalt),
    ad,
    kdf,
    ct: toB64(ct)
  }
}

export async function decryptEnvelope(envelope: Envelope, passphrase: string): Promise<any> {
  await initSodium()
  const vaultKey = await deriveVaultKey(passphrase, envelope.kdf)
  const itemKey = deriveItemKey(vaultKey, envelope.salt)
  const ad = envelope.ad ? new TextEncoder().encode(envelope.ad) : null
  const ct = fromB64(envelope.ct)
  const nonce = fromB64(envelope.nonce)
  const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct, ad ?? undefined, nonce, itemKey)
  return JSON.parse(new TextDecoder().decode(pt))
}

export function defaultKdf(): KdfParams {
  return {
    name: 'argon2id',
    salt_b64: toB64(randomBytes(16)),
    m: 65536,  // 64 MiB
    t: 3,
    p: 1
  }
}
