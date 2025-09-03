import type { Envelope, KdfParams, NostrEvent } from "../lib/types";
import {
  decryptEnvelope,
  defaultKdf,
  deriveVaultKey,
  encryptEnvelope,
  initSodium,
  toB64,
} from "../lib/crypto";
import { sha256 } from "@noble/hashes/sha256";
import { utf8ToBytes } from "@noble/hashes/utils";

export type Session = {
  pubkey: string | null;
  passphrase: string | null;
  kdf: KdfParams | null;
  unlocked: boolean;
  vaultKeyReady: boolean;
};

export const session: Session = {
  pubkey: null,
  passphrase: null,
  kdf: null,
  unlocked: false,
  vaultKeyReady: false,
};

export async function onSignerConnect(): Promise<string> {
  if (!("nostr" in window)) throw new Error("NIP-07 signer not found");
  // @ts-ignore
  const pk = await window.nostr.getPublicKey();
  session.pubkey = pk;
  return pk;
}

export function ensureKdf(): KdfParams {
  if (!session.kdf) session.kdf = defaultKdf();
  return session.kdf;
}

export async function unlockVault(passphrase: string): Promise<void> {
  session.passphrase = passphrase;
  session.unlocked = true;
  session.vaultKeyReady = true;
  await initSodium();
}

export function lockVault(): void {
  session.passphrase = null;
  session.unlocked = false;
  session.vaultKeyReady = false;
}

export function parseEnvelope(content: string): Envelope | null {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Explicit decrypt (takes passphrase argument)
export async function decryptItemContent(content: string, passphrase: string) {
  const env = parseEnvelope(content);
  if (!env) throw new Error("Invalid envelope");
  return await decryptEnvelope(env, passphrase);
}

// Convenience getters
export function getPassphrase(): string | null {
  return session.passphrase;
}
export function getPubkey(): string | null {
  return session.pubkey;
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
  const env = await encryptEnvelope(
    body,
    await deriveVaultKey(session.passphrase!, ensureKdf()),
    ensureKdf(),
  );
  const ev = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["d", opaqueIdentifier(id)]],
    content: JSON.stringify(env),
    pubkey,
  } as any;

  // @ts-ignore
  const signed = await window.nostr.signEvent(ev);
  console.log("[signEvent] signed", signed);
  return signed as NostrEvent;
}
