import type { Envelope, KdfParams, NostrEvent } from "../lib/types";
import {
  decryptEnvelope,
  defaultKdf,
  deriveVaultKey,
  encryptEnvelope,
  initSodium,
  toB64,
} from "../lib/crypto";
import signer from "../lib/signer";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

type Session = {
  pubkey: string | null;
  passphrase: Uint8Array | null;
  kdf: KdfParams | null;
  unlocked: boolean;
  vaultKeyReady: boolean;
};

const session: Session = {
  pubkey: null,
  passphrase: null,
  kdf: null,
  unlocked: false,
  vaultKeyReady: false,
};

export async function onSignerConnect(ncUrl?: string): Promise<string> {
  await signer.connect(ncUrl);
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

export function ensureKdf(): KdfParams {
  if (!session.kdf) session.kdf = defaultKdf();
  return session.kdf;
}

export async function unlockVault(passphrase: string): Promise<void> {
  session.passphrase = utf8ToBytes(passphrase);
  // Zero out the original passphrase string to avoid leaving sensitive data in memory
  passphrase = "";
  session.unlocked = true;
  session.vaultKeyReady = true;
  await initSodium();
}

export function lockVault(): void {
  if (session.passphrase) {
    session.passphrase.fill(0);
    session.passphrase = null;
  }
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

// Decrypt using in-memory session passphrase
export async function decryptItemContentUsingSession(content: string) {
  const env = parseEnvelope(content);
  if (!env) throw new Error("Invalid envelope");
  const pw = session.passphrase;
  if (!pw) throw new Error("Locked: no passphrase in memory");
  return await decryptEnvelope(env, pw);
}

export const NS_ITEM_PREFIX = "com.you.pm:item:";

function opaqueIdentifier(id: string): string {
  return NS_ITEM_PREFIX + toB64(sha256(utf8ToBytes(id)));
}

// Build a signed kind-30078 event for `id` with encrypted body
export async function buildItemEvent(
  id: string,
  body: any,
  pubkey: string,
): Promise<NostrEvent> {
  const pw = session.passphrase;
  if (!pw) throw new Error("Locked: no passphrase in memory");
  const kdf = ensureKdf();
  const vaultKey = await deriveVaultKey(pw, kdf);
  const env = await encryptEnvelope(body, vaultKey, kdf);
  vaultKey.fill(0);
  const ev = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["d", opaqueIdentifier(id)]],
    content: JSON.stringify(env),
    pubkey,
  } as any;

  // @ts-ignore
  const signed = await signer.signEvent(ev);
  return signed as NostrEvent;
}
