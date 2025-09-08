import { decryptWithVaultKey } from "../lib/crypto";
import { ensureVaultKey, buildVaultEvent } from "./vault";

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
  showFavicons: false,
  truncateFields: true,
  clipboardClearSec: 30,
  autolockSec: 300,
  defaultSort: { key: "title", dir: "asc" },
  favicon: { source: "ddg" },
  relays: ["wss://relay.nostrpass.me"],
  categories: [
    "Communication",
    "Development",
    "Education",
    "Entertainment",
    "Finance",
    "Household",
    "Personal",
    "Shopping",
    "Work",
    "Uncategorized",
  ],
};

function sanitize(parsed: any): Settings {
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
              .filter(
                (r: string) => r.startsWith("ws://") || r.startsWith("wss://"),
              ),
          ),
        )
      : DEFAULT_SETTINGS.relays,
  } as Settings;
}

export async function parseSettingsEvent(
  ev: NostrEvent,
): Promise<Settings | null> {
  try {
    const content = ev.content || "{}";
    const parsed = JSON.parse(content);
    if (
      !(
        parsed &&
        typeof parsed === "object" &&
        "v" in parsed &&
        "ct" in parsed &&
        "alg" in parsed &&
        "kdf" in parsed
      )
    ) {
      console.warn("Invalid settings envelope: missing fields");
      return null;
    }
    const env = parsed as Envelope;
    const vaultKey = await ensureVaultKey(env);
    const decrypted = await decryptWithVaultKey(env, vaultKey);
    return sanitize(decrypted);
  } catch (err) {
    console.warn("Failed to parse settings event", err);
    return null;
  }
}

// Build an app-data event for settings (NIP-33 parameterized replaceable).
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
          .filter((r) => r.startsWith("ws://") || r.startsWith("wss://")),
      ),
    ),
  };
  return buildVaultEvent(SETTINGS_D, sanitized, pubkey);
}
