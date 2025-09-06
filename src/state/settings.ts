import type { Envelope, NostrEvent } from "../lib/types";
import {
  decryptEnvelope,
  deriveVaultKey,
  encryptEnvelope,
} from "../lib/crypto";
import { ensureKdf, getPassphrase } from "./vault";

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
  relays: ["ws://127.0.0.1:3355"],
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
        "alg" in parsed
      )
    ) {
      console.warn("Invalid settings envelope: missing fields");
      return null;
    }
    const pw = getPassphrase();
    if (!pw) return null;
    const decrypted = await decryptEnvelope(parsed as Envelope, pw);
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
  const pw = getPassphrase();
  if (!pw) throw new Error("Locked: no passphrase in memory");
  const kdf = ensureKdf();
  const vaultKey = await deriveVaultKey(pw, kdf);
  const env = await encryptEnvelope(sanitized, vaultKey, kdf);
  vaultKey.fill(0);
  const content = JSON.stringify(env);
  const unsigned = {
    kind: 30078,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["d", SETTINGS_D]],
    content,
    pubkey,
  };

  const signer = (globalThis as any).nostr;
  if (!signer || typeof signer.signEvent !== "function") {
    throw new Error("No NIP-07 signer available to sign settings event");
  }

  const signed: NostrEvent = await signer.signEvent(unsigned);
  return signed;
}
