import React from "react";
import type { NostrEvent } from "../lib/types";
import {
  decryptItemContentUsingSession,
  getPassphrase,
  buildItemEvent,
} from "../state/vault";
import EditLoginModal from "./EditLoginModal";
import { totpFromBase32 } from "../lib/totp";
import type { Settings } from "../state/settings";

const NS_ITEM_PREFIX = "com.you.pm:item:"; // only show items in our item namespace
type PublishResult = { successes: string[]; failures: Record<string, string> };
type SortKey = "title" | "category" | "site" | "username";
const STEP = 30; // 30-second TOTP step

// normalize a site string into a safe <a href="..."> target
function toHref(site?: string | null): string | null {
  if (!site) return null;
  const v = String(site).trim();
  if (!v) return null;
  const hasProto = /^https?:\/\//i.test(v);
  const looksLikeDomain =
    /^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(v) || v.startsWith("www.");
  if (hasProto) return v;
  if (looksLikeDomain) return `https://${v}`;
  return null;
}

// extract hostname from site (adds https:// if needed)
function hostnameFromSite(site?: string | null): string | null {
  const href = toHref(site);
  if (!href) return null;
  try {
    const u = new URL(href);
    return (u.hostname || "").toLowerCase();
  } catch {
    return null;
  }
}

// favicon URL from settings
function faviconUrlForHost(host: string, settings: Settings): string {
  if (settings.favicon?.source === "custom") {
    const base = (settings.favicon.customBase || "").trim();
    // ensure trailing slash
    const normalized = base ? base.replace(/\/?$/, "/") : "";
    return `${normalized}${host}.ico`;
  }
  // default to DuckDuckGo ip3
  return `https://icons.duckduckgo.com/ip3/${host}.ico`;
}

export default function ItemList({
  events,
  pubkey,
  onPublish,
  onNewLogin,
  settings,
  onOpenSettings,
  onSaveSettings,
}: {
  events: NostrEvent[];
  pubkey: string;
  onPublish: (ev: any) => Promise<PublishResult>;
  onNewLogin: () => void;
  settings: Settings;
  onOpenSettings: () => void;
  onSaveSettings: (next: Settings) => Promise<void>;
}) {
  const [rows, setRows] = React.useState<any[]>([]);
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});
  const [editItem, setEditItem] = React.useState<any | null>(null);

  // search + sort (default alphabetical)
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortKey>("title");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const sortInitRef = React.useRef(false);

  // initialize sort from settings once
  React.useEffect(() => {
    if (sortInitRef.current) return;
    if (settings?.defaultSort) {
      setSortBy(settings.defaultSort.key as SortKey);
      setSortDir(settings.defaultSort.dir);
      sortInitRef.current = true;
    }
  }, [settings?.defaultSort]);

  // live TOTP codes map (idOrD -> code), refresh ONLY every 30s boundary
  const [otpMap, setOtpMap] = React.useState<Record<string, string>>({});
  const [counter, setCounter] = React.useState(
    Math.floor(Date.now() / 1000 / STEP),
  );
  const [remaining, setRemaining] = React.useState(
    STEP - (Math.floor(Date.now() / 1000) % STEP),
  );

  // cache hosts with broken favicons to avoid repeated network attempts
  const [badFavicons, setBadFavicons] = React.useState<Record<string, boolean>>(
    {},
  );

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!getPassphrase()) {
        setRows([]);
        return;
      } // locked; skip decrypts

      const out: any[] = [];
      for (const ev of events) {
        const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
        if (!d.startsWith(NS_ITEM_PREFIX)) continue; // skip anything not our item namespace
        try {
          const obj = await decryptItemContentUsingSession(ev.content);
          out.push({ d, ...obj });
        } catch {
          continue; // silently skip decrypt failures
        }
      }
      if (active) setRows(out);
    })();
    return () => {
      active = false;
    };
  }, [events]);

  // 1s heartbeat: update countdown; only refresh codes when the 30s counter changes
  React.useEffect(() => {
    const t = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);
      const curCounter = Math.floor(nowSec / STEP);
      const rem = STEP - (nowSec % STEP || 0);
      setRemaining(rem === 0 ? STEP : rem);
      if (curCounter !== counter) {
        setCounter(curCounter);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [counter]);

  // Recompute TOTP codes when rows or counter changes
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        rows.map(async (r) => {
          const key = r.id ?? r.d;
          if (!r.totpSecret) return [key, "" as const] as const;
          const code = await totpFromBase32(r.totpSecret);
          return [key, code ?? ""] as const;
        }),
      );
      if (!cancelled) setOtpMap(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [rows, counter]);

  const flagBusy = (id: string, v: boolean) =>
    setBusy((b) => ({ ...b, [id]: v }));

  const deleteItem = async (it: any) => {
    if (
      !confirm(
        "Delete this item? This publishes a new version marked as deleted.",
      )
    )
      return;
    try {
      flagBusy(it.id, true);
      const body = {
        ...it,
        category: it.category,
        deleted: true,
        updatedAt: Math.floor(Date.now() / 1000),
        version: (it.version ?? 0) + 1,
      };
      const ev = await buildItemEvent(it.d, body, pubkey);
      const res = await onPublish(ev);
      if (!res || res.successes.length === 0)
        alert("Delete publish did not get an OK from any relay.");
    } finally {
      flagBusy(it.id, false);
    }
  };

  const restoreItem = async (it: any) => {
    try {
      flagBusy(it.id, true);
      const body = {
        ...it,
        category: it.category,
        deleted: false,
        updatedAt: Math.floor(Date.now() / 1000),
        version: (it.version ?? 0) + 1,
      };
      const ev = await buildItemEvent(it.d, body, pubkey);
      const res = await onPublish(ev);
      if (!res || res.successes.length === 0)
        alert("Restore publish did not get an OK from any relay.");
    } finally {
      flagBusy(it.id, false);
    }
  };

  // computed table data
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => (settings.showDeleted ? true : !r.deleted))
      .filter((r) => {
        if (!q) return true;
        const hay =
          `${r.title ?? ""} ${r.site ?? ""} ${r.username ?? ""} ${r.category ?? ""} ${r.type ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
  }, [rows, query, settings.showDeleted]);

  const sorted = React.useMemo(() => {
    const arr = filtered.slice();
    arr.sort((a, b) => {
      const va = a[sortBy] ?? (sortBy === "category" ? "Uncategorized" : "");
      const vb = b[sortBy] ?? (sortBy === "category" ? "Uncategorized" : "");
      let cmp = 0;
      if (sortBy === "updatedAt") cmp = (va || 0) - (vb || 0);
      else cmp = String(va).localeCompare(String(vb));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortBy === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir(key === "updatedAt" ? "desc" : "asc");
    }
  };

  const sortIndicator = (key: SortKey) =>
    sortBy === key ? (sortDir === "asc" ? "▲" : "▼") : "";

  const copyText = async (text?: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.error("Failed to copy text", e);
    }
  };

  const copyPassword = async (pw?: string) => {
    if (!pw) return;
    try {
      await navigator.clipboard.writeText(pw);
    } catch (e) {
      console.error("Failed to copy password", e);
    }
  };

  const visible = sorted;

  // helper: conditional truncation classes + tooltip
  const trunc = (enabled: boolean) =>
    enabled
      ? "block max-w-[40ch] overflow-hidden text-ellipsis whitespace-nowrap"
      : "";

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <input
            placeholder="Search all logins..."
            className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-600"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            className="inline-flex items-center justify-center h-10 px-3 rounded-lg border border-emerald-600 text-emerald-300 hover:bg-emerald-600/10 whitespace-nowrap min-w-[7.5rem] shrink-0"
            onClick={onNewLogin}
            title="Create a new login"
            type="button"
          >
            New Login
          </button>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            className="px-3 py-1 rounded-lg border border-slate-600 hover:bg-slate-600/10"
            type="button"
            onClick={onOpenSettings}
            title="Open settings"
          >
            Settings
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-800">
              <Th
                label="Title"
                onClick={() => toggleSort("title")}
                ind={sortIndicator("title")}
              />
              <Th
                label="Category"
                onClick={() => toggleSort("category")}
                ind={sortIndicator("category")}
              />
              <Th
                label="Site"
                onClick={() => toggleSort("site")}
                ind={sortIndicator("site")}
              />
              <Th
                label="Username"
                onClick={() => toggleSort("username")}
                ind={sortIndicator("username")}
              />
              <th className="py-2 px-2">Password</th>
              <th className="py-2 px-2 text-center">
                <span className="inline-flex items-center gap-2">
                  2FA Token
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    ({String(remaining).padStart(2, "0")}s)
                  </span>
                </span>
              </th>
              <th className="py-2 px-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-slate-400 text-center">
                  No items yet.
                </td>
              </tr>
            )}
            {visible.map((it) => {
              const isBusy = !!busy[it.id];
              const siteHref = toHref(it.site);
              const key = it.id ?? it.d;
              const code = otpMap[key] || "—";

              const host = hostnameFromSite(it.site);
              const showFavicon =
                settings.showFavicons && !!host && !badFavicons[host];

              return (
                <tr key={key} className="border-b border-slate-800/60">
                  <>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-2">
                        {showFavicon ? (
                          <img
                            src={faviconUrlForHost(host!, settings)}
                            alt=""
                            aria-hidden="true"
                            className="w-5 h-5 rounded-sm bg-slate-800/50"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setBadFavicons((m) => ({ ...m, [host!]: true }))
                            }
                          />
                        ) : (
                          <span
                            className="w-5 h-5 rounded-sm bg-slate-800/50 inline-block"
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={trunc(settings.truncateFields)}
                          title={String(it.title || "")}
                        >
                          {it.title || "(untitled)"}
                        </span>
                      </span>
                    </td>

                    <td className="py-2 px-2">
                      {it.category || "Uncategorized"}
                    </td>

                    <td className="py-2 px-2">
                      {siteHref ? (
                        <a
                          href={siteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-dotted hover:decoration-solid"
                          title={siteHref}
                        >
                          <span
                            className={trunc(settings.truncateFields)}
                            title={String(it.site || "")}
                          >
                            {it.site}
                          </span>
                        </a>
                      ) : (
                        <span
                          className={trunc(settings.truncateFields)}
                          title={String(it.site || "")}
                        >
                          {it.site || "—"}
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-2">
                      {it.username ? (
                        <span
                          className="cursor-pointer hover:underline decoration-dotted"
                          title="Copy username"
                          onClick={() => copyText(it.username)}
                        >
                          {it.username}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-2 px-2">
                      {it.password ? (
                        <span
                          className="hover:underline"
                          onClick={() => copyPassword(it.password)}
                          title="Copy password"
                        >
                          **********
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-2 px-2 font-mono tabular-nums text-center">
                      {code && code !== "—" ? (
                        <span
                          className="cursor-pointer hover:underline decoration-dotted"
                          title="Copy 2FA token"
                          onClick={() => copyText(code)}
                        >
                          {code}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2 justify-end">
                        {!it.deleted && (
                          <button
                            className="px-2 py-1 rounded border border-slate-600 hover:bg-slate-600/10 disabled:opacity-50"
                            onClick={() => setEditItem(it)}
                            disabled={isBusy}
                            title="Edit"
                          >
                            Edit
                          </button>
                        )}
                        {!it.deleted ? (
                          <button
                            className="px-2 py-1 rounded border border-rose-400 text-rose-400 hover:bg-rose-600/10 disabled:opacity-50"
                            onClick={() => deleteItem(it)}
                            disabled={isBusy}
                            title="Delete"
                          >
                            {isBusy ? "Deleting…" : "Delete"}
                          </button>
                        ) : (
                          <button
                            className="px-2 py-1 rounded border border-emerald-600 text-emerald-300 hover:bg-emerald-600/10 disabled:opacity-50"
                            onClick={() => restoreItem(it)}
                            disabled={isBusy}
                            title="Restore"
                          >
                            {isBusy ? "Restoring…" : "Restore"}
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      <EditLoginModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        pubkey={pubkey}
        onPublish={onPublish}
        item={editItem}
        settings={settings}
        onSaveSettings={onSaveSettings}
      />
    </div>
  );
}

function Th({
  label,
  onClick,
  ind,
}: {
  label: string;
  onClick: () => void;
  ind: string;
}) {
  return (
    <th
      className="py-2 px-2 cursor-pointer select-none"
      onClick={onClick}
      title="Sort"
    >
      <span className="inline-flex items-center gap-1">
        {label} <span className="text-xs">{ind}</span>
      </span>
    </th>
  );
}
