import type { NostrEvent } from "./types";

export type Profile = {
  name?: string;
  display_name?: string;
  picture?: string;
  about?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  created_at?: number;
};

export function parseProfileEvent(ev: NostrEvent): Profile | null {
  if (ev.kind !== 0) return null;
  try {
    const obj = JSON.parse(ev.content);
    if (!obj || typeof obj !== "object") return null;
    return { ...obj, created_at: ev.created_at };
  } catch {
    return null;
  }
}

// Prefer display_name → name → fallback
export function bestName(p: Profile | null, fallback: string): string {
  return p?.display_name?.trim() || p?.name?.trim() || fallback;
}

// Only allow http(s) avatar URLs; otherwise return null
export function avatarFrom(p: Profile | null): string | null {
  const url = p?.picture?.trim();
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return null;
}
