import type { NostrEvent } from "../lib/types";

export const SETTINGS_D = "com.you.pm:settings:v1";

export type Settings = {
  showDeleted: boolean;
  showFavicons: boolean;
  // room to grow:
  // defaultSort?: { key: "title" | "site" | "username" | "updatedAt"; dir: "asc" | "desc" };
};

export const DEFAULT_SETTINGS: Settings = {
  showDeleted: false,
  showFavicons: true,
};

export function parseSettingsEvent(ev: NostrEvent): Settings | null {
  try {
    const parsed = JSON.parse(ev.content || "{}");
    // merge with defaults to be resilient to older versions
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    } as Settings;
  } catch {
    return null;
  }
}

// Build a plaintext app-data event for settings (NIP-33 parameterized replaceable).
// Uses NIP-07 (window.nostr) to sign.
export async function buildSettingsEvent(
  pubkey: string,
  settings: Settings,
): Promise<NostrEvent> {
  const unsigned = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["d", SETTINGS_D]],
    content: JSON.stringify(settings),
    pubkey,
  };

  // Prefer NIP-07 signer
  const signer = (globalThis as any).nostr;
  if (!signer || typeof signer.signEvent !== "function") {
    throw new Error("No NIP-07 signer available to sign settings event");
  }

  const signed: NostrEvent = await signer.signEvent(unsigned);
  return signed;
}
