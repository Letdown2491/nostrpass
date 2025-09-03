import type { NostrEvent } from "../lib/types";

export const SETTINGS_D = "com.you.pm:settings:v1";

// Keep in sync with your table's supported sort keys
export type TableSortKey = "title" | "site" | "username" | "updatedAt";
export type TableSortDir = "asc" | "desc";

export type Settings = {
  // existing
  showDeleted: boolean;
  showFavicons: boolean;
  clipboardClearSec: number | null; // clear clipboard
  autolockSec: number | null; // lock vault after inactivity
  truncateFields: boolean; // ellipsis + tooltip for long Title/Site
  defaultSort: { key: TableSortKey; dir: TableSortDir };
  favicon: {
    source: "ddg" | "custom";
    customBase?: string; // e.g. https://icons.example.com/ip3/
  };
  categories: string[];
  relays: string[];
};

export const DEFAULT_SETTINGS: Settings = {
  showDeleted: false,
  showFavicons: true,
  truncateFields: true,
  clipboardClearSec: 30,
  autolockSec: 300,
  defaultSort: { key: "title", dir: "asc" },
  favicon: { source: "ddg" },
  relays: ["wss://relay.primal.net"],
  categories: [
    "Communication",
    "Development",
    "Education",
    "Entertainment",
    "Household",
    "Personal",
    "Shopping",
    "Work",
    "Uncategorized",
  ],
};

export function parseSettingsEvent(ev: NostrEvent): Settings | null {
  try {
    const parsed = JSON.parse(ev.content || "{}");
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      defaultSort: {
        ...DEFAULT_SETTINGS.defaultSort,
        ...(parsed?.defaultSort ?? {}),
      },
      favicon: {
        ...DEFAULT_SETTINGS.favicon,
        ...(parsed?.favicon ?? {}),
      },
      categories: Array.isArray(parsed?.categories)
        ? Array.from(
            new Set([...DEFAULT_SETTINGS.categories, ...parsed.categories]),
          )
        : DEFAULT_SETTINGS.categories,
      relays: Array.isArray(parsed?.relays)
        ? Array.from(
            new Set(
              parsed.relays
                .map((r: any) => (typeof r === "string" ? r.trim() : ""))
                .filter((r: string) => r.startsWith("wss://")),
            ),
          )
        : DEFAULT_SETTINGS.relays,
    } as Settings;
  } catch {
    return null;
  }
}

// Build a plaintext app-data event for settings (NIP-33 parameterized replaceable).
export async function buildSettingsEvent(
  pubkey: string,
  settings: Settings,
): Promise<NostrEvent> {
  const sanitized: Settings = {
    ...settings,
    relays: Array.from(
      new Set(
        settings.relays
          .map((r) => r.trim())
          .filter((r) => r.startsWith("wss://")),
      ),
    ),
  };
  const unsigned = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["d", SETTINGS_D]],
    content: JSON.stringify(sanitized),
    pubkey,
  };

  const signer = (globalThis as any).nostr;
  if (!signer || typeof signer.signEvent !== "function") {
    throw new Error("No NIP-07 signer available to sign settings event");
  }

  const signed: NostrEvent = await signer.signEvent(unsigned);
  return signed;
}
