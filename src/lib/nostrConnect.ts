import { generateSecretKey, getPublicKey } from "nostr-tools";
import { bytesToHex, randomBytes } from "@noble/hashes/utils";

export interface NostrConnectDeepLink {
  uri: string;
  secretKey: Uint8Array;
  publicKey: string;
  relays: string[];
  secret: string;
}

export function buildNostrConnectURI(
  relays: string[],
  metadata?: Record<string, any>,
): NostrConnectDeepLink {
  const secretKey = generateSecretKey();
  const publicKey = getPublicKey(secretKey);
  const secret = bytesToHex(randomBytes(32));
  const url = new URL(`nostrconnect://${publicKey}`);
  for (const r of relays) url.searchParams.append("relay", r);
  url.searchParams.set("secret", secret);
  if (metadata) {
    try {
      const encoded = btoa(JSON.stringify(metadata));
      url.searchParams.set("metadata", encoded);
    } catch {
      // ignore metadata if serialization fails
    }
  }
  return { uri: url.toString(), secretKey, publicKey, relays, secret };
}
