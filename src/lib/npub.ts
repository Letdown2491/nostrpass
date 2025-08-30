import { nip19 } from "nostr-tools";

export function toNpub(hex: string): string {
  return nip19.npubEncode(hex);
}

export function shortNpub(npub: string, left = 10, right = 6): string {
  if (!npub) return "";
  return npub.length <= left + right + 1
    ? npub
    : `${npub.slice(0, left)}…${npub.slice(-right)}`;
}
