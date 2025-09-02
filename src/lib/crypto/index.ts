import sodium from "libsodium-wrappers";
import { hkdf } from "@noble/hashes/hkdf";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";
import type { Envelope, KdfParams } from "../types";

let argon2Worker: Worker | null = null;
let nextMessageId = 0;
const pending = new Map<
  number,
  { resolve: (value: Uint8Array) => void; reject: (reason: any) => void }
>();

function getArgon2Worker(): Worker {
  if (!argon2Worker) {
    argon2Worker = new Worker(new URL("./argon2.worker.ts", import.meta.url), {
      type: "module",
    });
    argon2Worker.onmessage = (event: MessageEvent) => {
      const { id, key, error } = event.data as {
        id: number;
        key?: ArrayBuffer;
        error?: string;
      };
      const promise = pending.get(id);
      if (!promise) return;
      if (error) promise.reject(new Error(error));
      else promise.resolve(new Uint8Array(key!));
      pending.delete(id);
    };
    globalThis.addEventListener("beforeunload", () => {
      argon2Worker?.terminate();
      argon2Worker = null;
    });
  }
  return argon2Worker;
}

export function terminateArgon2Worker() {
  argon2Worker?.terminate();
  argon2Worker = null;
}

export async function initSodium() {
  if ((sodium as any)._sodium_initialized) return;
  await sodium.ready;
  (sodium as any)._sodium_initialized = true;
}

export function randomBytes(len: number): Uint8Array {
  return sodium.randombytes_buf(len);
}

export function generatePassword(length = 16): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:,.<>?";
  const bytes = new Uint8Array(length);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.getRandomValues) {
    throw new Error("Secure random number generator not available.");
  }
  cryptoObj.getRandomValues(bytes);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += charset[bytes[i] % charset.length];
  }
  return result;
}

export function toB64(u8: Uint8Array): string {
  return sodium.to_base64(u8, sodium.base64_variants.ORIGINAL);
}

export function fromB64(b: string): Uint8Array {
  return sodium.from_base64(b, sodium.base64_variants.ORIGINAL);
}

export async function deriveVaultKey(
  passphrase: string,
  kdf: KdfParams,
): Promise<Uint8Array> {
  const worker = getArgon2Worker();
  const salt = fromB64(kdf.salt_b64);
  return new Promise((resolve, reject) => {
    const id = nextMessageId++;
    pending.set(id, { resolve, reject });
    worker.postMessage({ id, passphrase, kdf, salt }, [salt.buffer]);
  });
}

export function deriveItemKey(
  vaultKey: Uint8Array,
  itemSalt_b64: string,
): Uint8Array {
  const salt = fromB64(itemSalt_b64);
  const info = utf8ToBytes("item-subkeys-v1");
  return hkdf(sha256, vaultKey, salt, info, 32);
}

export async function encryptEnvelope(
  plaintextObj: any,
  vaultKey: Uint8Array,
  kdf: KdfParams,
): Promise<Envelope> {
  await initSodium();
  const nonce = randomBytes(
    sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES,
  );
  const itemSalt = randomBytes(16);
  const itemKey = deriveItemKey(vaultKey, toB64(itemSalt));

  const ad = "pm.nostr.v1";
  const pt = new TextEncoder().encode(JSON.stringify(plaintextObj));
  const ct = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
    pt,
    new TextEncoder().encode(ad),
    null,
    nonce,
    itemKey,
  );
  return {
    v: 1,
    alg: "xchacha20poly1305",
    nonce: toB64(nonce),
    salt: toB64(itemSalt),
    ad,
    kdf,
    ct: toB64(ct),
  };
}

export async function decryptEnvelope(
  envelope: Envelope,
  passphrase: string,
): Promise<any> {
  await initSodium();
  const vaultKey = await deriveVaultKey(passphrase, envelope.kdf);
  const itemKey = deriveItemKey(vaultKey, envelope.salt);
  const ad = envelope.ad ? new TextEncoder().encode(envelope.ad) : null;
  const ct = fromB64(envelope.ct);
  const nonce = fromB64(envelope.nonce);
  const pt = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    null,
    ct,
    ad ?? undefined,
    nonce,
    itemKey,
  );
  return JSON.parse(new TextDecoder().decode(pt));
}

export function defaultKdf(): KdfParams {
  return {
    name: "argon2id",
    salt_b64: toB64(randomBytes(16)),
    m: 65536, // 64 MiB
    t: 3,
    p: 1,
  };
}
