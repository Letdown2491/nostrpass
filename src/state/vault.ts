import type { Envelope, KdfParams, NostrEvent } from "../lib/types";
import {
  defaultKdf,
  deriveVaultKey,
  encryptWithVaultKey,
  decryptWithVaultKey,
  initSodium,
  toB64,
} from "../lib/crypto";
import signer from "../lib/signer";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

type Session = {
  pubkey: string | null;
  passphrase: Uint8Array | null;
  vaultKey: Uint8Array | null;
  kdf: KdfParams | null;
  unlocked: boolean;
  vaultKeyReady: boolean;
};

const session: Session = {
  pubkey: null,
  passphrase: null,
  vaultKey: null,
  kdf: null,
  unlocked: false,
  vaultKeyReady: false,
};

export async function onSignerConnect(ncUrl?: string): Promise<string> {
  try {
    await signer.connect(ncUrl);
    const pk = await signer.getPublicKey();
    session.pubkey = pk;
    return pk;
  } catch (err) {
    session.pubkey = null;
    throw err;
  }
}

export async function onRemoteSignerConnect(
  relays: string[],
  remotePubkey: string,
  metadata?: Record<string, any>,
): Promise<string> {
  try {
    await signer.connectWithDeepLink(relays, remotePubkey, metadata);
    const pk = await signer.getPublicKey();
    session.pubkey = pk;
    return pk;
  } catch (err) {
    session.pubkey = null;
    throw err;
  }
}

export async function ensureKdf(): Promise<KdfParams> {
  if (!session.kdf) session.kdf = await defaultKdf();
  return session.kdf;
}

export async function unlockVault(passphrase: string): Promise<void> {
  await initSodium();
  session.passphrase = utf8ToBytes(passphrase);
  const kdf = await ensureKdf();
  session.vaultKey = await deriveVaultKey(session.passphrase, kdf);
  // Zero out the original passphrase string to avoid leaving sensitive data in memory
  passphrase = "";
  session.unlocked = true;
  session.vaultKeyReady = true;
  if (session.vaultKey) {
    session.vaultKey.fill(0);
    session.vaultKey = null;
  }
  session.kdf = null;
}

export function lockVault(): void {
  if (session.passphrase) {
    session.passphrase.fill(0);
    session.passphrase = null;
  }
  if (session.vaultKey) {
    session.vaultKey.fill(0);
    session.vaultKey = null;
  }
  session.kdf = null;
  session.unlocked = false;
  session.vaultKeyReady = false;
}

function parseEnvelope(content: string): Envelope | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Convenience getters
export function getPassphrase(): Uint8Array | null {
  return session.passphrase;
}

function kdfParamsEqual(a: KdfParams | null, b: KdfParams): boolean {
  return (
    !!a &&
    a.name === b.name &&
    a.salt_b64 === b.salt_b64 &&
    a.m === b.m &&
    a.t === b.t &&
    a.p === b.p
  );
}

export async function ensureVaultKey(envelope: Envelope): Promise<Uint8Array> {
  const pw = session.passphrase;
  if (!pw) throw new Error("Locked: no passphrase in memory");
  if (!session.vaultKey || !kdfParamsEqual(session.kdf, envelope.kdf)) {
    const vaultKey = await deriveVaultKey(pw, envelope.kdf);
    if (session.vaultKey) session.vaultKey.fill(0);
    session.vaultKey = vaultKey;
    session.kdf = envelope.kdf;
  }
  return session.vaultKey!;
}

// Decrypt using in-memory session vault key
export async function decryptItemContentUsingSession(content: string) {
  const env = parseEnvelope(content);
  if (!env) throw new Error("Invalid envelope");
  const vaultKey = await ensureVaultKey(env);
  return await decryptWithVaultKey(env, vaultKey);
}

export const NS_ITEM_PREFIX = "com.you.pm:item:";

function opaqueIdentifier(id: string): string {
  return NS_ITEM_PREFIX + toB64(sha256(utf8ToBytes(id)));
}

// Build a signed kind-30078 event for `id` with encrypted body
export async function buildVaultEvent(
  d: string,
  body: any,
  pubkey: string,
): Promise<NostrEvent> {
  await initSodium();
  const vk = session.vaultKey;
  if (!vk) throw new Error("Locked: no vault key in memory");
  const kdf = await ensureKdf();
  const env = await encryptWithVaultKey(body, vk, kdf);
  const ev = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["d", d]],
    content: JSON.stringify(env),
    pubkey,
  } as any;

  // @ts-ignore
  const signed = await signer.signEvent(ev);
  return signed as NostrEvent;
}

// Build a signed kind-30078 event for `id` with encrypted body
export async function buildItemEvent(
  id: string,
  body: any,
  pubkey: string,
): Promise<NostrEvent> {
  await initSodium();
  return buildVaultEvent(opaqueIdentifier(id), body, pubkey);
}
