import React from "react";
import type { LoginItem, NostrEvent, PublishResult } from "../lib/types";
import {
  decryptItemContentUsingSession,
  getPassphrase,
  buildItemEvent,
} from "../state/vault";
import EditLoginModal from "./EditLoginModal";
import { totpFromBase32 } from "../lib/totp";
import type { Settings } from "../state/settings";
import { NewLoginIcon, SettingsIcon } from "./Icons";
import ItemRow from "./ItemRow";
import ItemTableHeader from "./ItemTableHeader";
import useItemSorting from "../hooks/useItemSorting";

const NS_ITEM_PREFIX = "com.you.pm:item:"; // only show items in our item namespace
const STEP = 30; // 30-second TOTP step

export default function ItemList({
  events,
  pubkey,
  onPublish,
  onNewLogin,
  settings,
  onOpenSettings,
  onSaveSettings,
  onLoaded,
}: {
  events: NostrEvent[];
  pubkey: string;
  onPublish: (ev: NostrEvent) => Promise<PublishResult>;
  onNewLogin: () => void;
  settings: Settings;
  onOpenSettings: () => void;
  onSaveSettings: (next: Settings) => Promise<void>;
  onLoaded: () => void;
}) {
  interface ItemRow extends LoginItem {
    d: string;
  }

  const [rows, setRows] = React.useState<ItemRow[]>([]);
  const [pending, setPending] = React.useState(0);
  const [busy, setBusy] = React.useState<Record<string, boolean>>({});
  const [editItem, setEditItem] = React.useState<ItemRow | null>(null);

  const { query, setQuery, visible, toggleSort, sortIndicator } =
    useItemSorting(rows, settings);

  const [inputQuery, setInputQuery] = React.useState(query);
  const queryTimeout = React.useRef<ReturnType<typeof setTimeout>>();

  const debouncedSetQuery = (v: string) => {
    setInputQuery(v);
    if (queryTimeout.current) clearTimeout(queryTimeout.current);
    queryTimeout.current = setTimeout(() => setQuery(v), 300);
  };

  React.useEffect(() => {
    return () => {
      if (queryTimeout.current) clearTimeout(queryTimeout.current);
    };
  }, []);

  React.useEffect(() => {
    setInputQuery(query);
  }, [query]);

  // live TOTP codes map (idOrD -> code), refresh ONLY every 30s boundary
  const [otpMap, setOtpMap] = React.useState<Record<string, string>>({});
  const [counter, setCounter] = React.useState(
    Math.floor(Date.now() / 1000 / STEP),
  );
  const [remaining, setRemaining] = React.useState(
    STEP - (Math.floor(Date.now() / 1000) % STEP),
  );

  const otpCache = React.useRef<
    Record<string, { counter: number; code: string; secret: string }>
  >({});

  // cache hosts with broken favicons to avoid repeated network attempts
  const [badFavicons, setBadFavicons] = React.useState<Record<string, boolean>>(
    {},
  );

  // trigger favicon reload when network comes back online
  const [faviconRetry, setFaviconRetry] = React.useState(0);
  React.useEffect(() => {
    const onOnline = () => {
      setBadFavicons({});
      setFaviconRetry((n) => n + 1);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!getPassphrase()) {
        setRows([]);
        setPending(0);
        onLoaded();
        return;
      }

      setRows([]);
      setPending(events.length);
      onLoaded();

      const promises = events.map(async (ev) => {
        const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
        if (!d.startsWith(NS_ITEM_PREFIX)) return null;
        const obj = (await decryptItemContentUsingSession(
          ev.content,
        )) as LoginItem;
        return { d, ...obj } as ItemRow;
      });

      const results = await Promise.allSettled(promises);
      if (!active) return;

      const decoded = results
        .filter(
          (r): r is PromiseFulfilledResult<ItemRow | null> =>
            r.status === "fulfilled",
        )
        .map((r) => r.value)
        .filter((r): r is ItemRow => !!r);

      setRows(decoded);
      setPending(0);
    })();
    return () => {
      active = false;
    };
  }, [events, onLoaded]);

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
      const keys = new Set(rows.map((r) => r.id ?? r.d));
      const toUpdate = rows
        .filter((r) => r.totpSecret)
        .map(async (r) => {
          const key = r.id ?? r.d;
          const cached = otpCache.current[key];
          if (
            cached &&
            cached.counter === counter &&
            cached.secret === r.totpSecret
          )
            return;
          const code = await totpFromBase32(
            r.totpSecret!,
            counter * STEP * 1000,
          );
          if (!cancelled)
            otpCache.current[key] = {
              counter,
              secret: r.totpSecret!,
              code: code ?? "",
            };
        });
      await Promise.all(toUpdate);
      if (cancelled) return;

      for (const key of Object.keys(otpCache.current)) {
        if (!keys.has(key)) delete otpCache.current[key];
      }

      const next: Record<string, string> = {};
      for (const r of rows) {
        const key = r.id ?? r.d;
        next[key] = otpCache.current[key]?.code ?? "";
      }
      setOtpMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [rows, counter]);

  const flagBusy = (id: string, v: boolean) =>
    setBusy((b) => ({ ...b, [id]: v }));

  const deleteItem = async (it: ItemRow) => {
    if (
      !confirm(
        "Delete this item? This publishes a new version marked as deleted.",
      )
    )
      return;
    try {
      flagBusy(it.id, true);
      const { d, ...rest } = it;
      const body: LoginItem = {
        ...rest,
        category: rest.category,
        deleted: true,
        updatedAt: Math.floor(Date.now() / 1000),
        version: (rest.version ?? 0) + 1,
      };
      const ev = await buildItemEvent(d, body, pubkey);
      const res = await onPublish(ev);
      if (!res || res.successes.length === 0)
        alert("Delete publish did not get an OK from any relay.");
    } finally {
      flagBusy(it.id, false);
    }
  };

  const restoreItem = async (it: ItemRow) => {
    try {
      flagBusy(it.id, true);
      const { d, ...rest } = it;
      const body: LoginItem = {
        ...rest,
        category: rest.category,
        deleted: false,
        updatedAt: Math.floor(Date.now() / 1000),
        version: (rest.version ?? 0) + 1,
      };
      const ev = await buildItemEvent(d, body, pubkey);
      const res = await onPublish(ev);
      if (!res || res.successes.length === 0)
        alert("Restore publish did not get an OK from any relay.");
    } finally {
      flagBusy(it.id, false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 w-full sm:max-w-md">
          <input
            placeholder="Search all logins..."
            className="w-full h-10 px-3 rounded-lg border border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-600"
            value={inputQuery}
            onChange={(e) => debouncedSetQuery(e.target.value)}
            autoComplete="off"
          />
          <button
            className="px-3 py-3 rounded-lg border border-emerald-600 text-emerald-300 hover:bg-emerald-600/40"
            onClick={onNewLogin}
            title="Create a new login"
            type="button"
          >
            <NewLoginIcon width="16" height="16" /> {/* Add entry */}
          </button>
          <button
            className="px-3 py-3 rounded-lg border border-slate-600 hover:bg-slate-600/50"
            type="button"
            onClick={onOpenSettings}
            title="Open settings"
          >
            <SettingsIcon width="16" height="16" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <ItemTableHeader
            remaining={remaining}
            toggleSort={toggleSort}
            sortIndicator={sortIndicator}
          />
          <tbody>
            {visible.length === 0 && pending === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-slate-400 text-center">
                  No items yet.
                </td>
              </tr>
            )}
            {visible.map((it) => {
              const isBusy = !!busy[it.id];
              const key = it.id ?? it.d;
              const code = otpMap[key] || "—";

              return (
                <ItemRow
                  key={key}
                  item={it}
                  code={code}
                  settings={settings}
                  isBusy={isBusy}
                  onEdit={() => setEditItem(it)}
                  onDelete={() => deleteItem(it)}
                  onRestore={() => restoreItem(it)}
                  badFavicons={badFavicons}
                  setBadFavicons={setBadFavicons}
                  faviconRetry={faviconRetry}
                />
              );
            })}
            {Array.from({ length: pending }).map((_, i) => (
              <tr
                key={`placeholder-${i}`}
                className="border-b border-slate-800/60 animate-pulse"
              >
                <td className="py-2 px-2">
                  <div className="h-5 w-24 bg-slate-700 rounded" />
                </td>
                <td className="py-2 px-2">
                  <div className="h-5 w-24 bg-slate-700 rounded" />
                </td>
                <td className="py-2 px-2">
                  <div className="h-5 w-24 bg-slate-700 rounded" />
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="h-5 w-8 bg-slate-700 rounded ml-auto" />
                </td>
              </tr>
            ))}
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
