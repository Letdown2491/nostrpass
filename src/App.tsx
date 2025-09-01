import React from "react";
import Login from "./components/Login";
import Unlock from "./components/Unlock";
import ItemList from "./components/ItemList";
import NewLoginModal from "./components/NewLoginModal";
import ProfileBadge from "./components/ProfileBadge";
import { LogoIcon } from "./components/Icons";
import SettingsModal from "./components/SettingsModal";
import { RelayPool } from "./lib/relays";
import type { NostrEvent } from "./lib/types";
import { toNpub } from "./lib/npub";
import { parseProfileEvent, type Profile } from "./lib/profile";
import { db } from "./lib/db";
import { decryptItemContentUsingSession, lockVault } from "./state/vault";
import {
  DEFAULT_SETTINGS,
  SETTINGS_D,
  type Settings,
  parseSettingsEvent,
  buildSettingsEvent,
} from "./state/settings";

const DEFAULT_RELAYS = [
  "wss://premium.primal.net",
  // "ws://127.0.0.1:3355",
];

export default function App() {
  const [pubkey, setPubkey] = React.useState<string | null>(null);
  const [unlocked, setUnlocked] = React.useState(false);
  const [events, setEvents] = React.useState<NostrEvent[]>([]);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [showNewLogin, setShowNewLogin] = React.useState(false);

  // settings state (synced to npub)
  const [settings, setSettings] = React.useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = React.useState(false);

  const poolRef = React.useRef<RelayPool | null>(null);
  const idleTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const npub = React.useMemo(() => (pubkey ? toNpub(pubkey) : ""), [pubkey]);

  const storeEvent = React.useCallback(
    async (ev: NostrEvent, pending: 1 | 0) => {
      const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
      await db.events.put({
        id: ev.id,
        d,
        created_at: ev.created_at,
        content: ev.content,
        raw: ev,
        pending,
      });
      try {
        const body: any = await decryptItemContentUsingSession(ev.content);
        await db.index.put({
          d,
          version: body.version ?? 0,
          updatedAt: body.updatedAt ?? ev.created_at,
          type: body.type ?? "",
          title: body.title,
        });
      } catch {
        await db.index.put({
          d,
          version: 0,
          updatedAt: ev.created_at,
          type: "",
          title: undefined,
        });
      }
    },
    [],
  );

  const clearDb = React.useCallback(async () => {
    await db.events.clear();
    await db.index.clear();
  }, []);

  const publishPending = React.useCallback(async () => {
    if (!poolRef.current) return;
    const pending = await db.events.where("pending").equals(1).toArray();
    for (const p of pending) {
      try {
        const res = await poolRef.current.publish(p.raw as NostrEvent);
        if (res?.successes?.length) {
          await db.events.update(p.id, { pending: 0 });
        }
      } catch {
        // keep pending
      }
    }
  }, []);

  const handleUnlocked = React.useCallback(async () => {
    const cached = await db.events.orderBy("created_at").toArray();
    const latest = new Map<string, (typeof cached)[number]>();
    cached.forEach((r) => {
      const existing = latest.get(r.d);
      if (!existing || r.created_at > existing.created_at) latest.set(r.d, r);
    });
    setEvents(Array.from(latest.values()).map((r) => r.raw as NostrEvent));
    setUnlocked(true);
  }, []);

  const startSub = React.useCallback(
    (pk: string) => {
      const pool = new RelayPool(DEFAULT_RELAYS);
      pool.connect();
      poolRef.current = pool;

      // Subscribe to parameterized replaceable app data (kind 30078) - items (broad, we filter in ItemList)
      const dataFilters = [{ authors: [pk], kinds: [30078], limit: 2000 }];
      pool.subscribe(
        dataFilters,
        async (ev) => {
          const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
          await storeEvent(ev, 0);
          // Keep newest per d
          setEvents((prev) => {
            const idx = prev.findIndex(
              (p) => (p.tags.find((t) => t[0] === "d")?.[1] ?? "") === d,
            );
            if (idx >= 0) {
              const existing = prev[idx];
              if (ev.created_at > existing.created_at) {
                const copy = prev.slice();
                copy[idx] = ev;
                return copy;
              }
              return prev;
            }
            return [...prev, ev];
          });
        },
        () => {
          // EOSE for data
        },
      );

      // Subscribe to profile metadata (kind 0). Replaceable; pick latest created_at.
      const profileFilters = [{ authors: [pk], kinds: [0], limit: 1 }];
      pool.subscribe(
        profileFilters,
        (ev) => {
          const p = parseProfileEvent(ev);
          if (!p) return;
          setProfile((cur) => {
            if (!cur) return p;
            if ((p.created_at ?? 0) > (cur.created_at ?? 0)) return p;
            return cur;
          });
        },
        () => {},
      );

      // Subscribe to SETTINGS (a specific parameterized replaceable)
      const settingsFilters = [
        { authors: [pk], kinds: [30078], "#d": [SETTINGS_D], limit: 1 },
      ];
      pool.subscribe(
        settingsFilters,
        (ev) => {
          const parsed = parseSettingsEvent(ev);
          if (parsed) {
            setSettings((cur) => ({ ...cur, ...parsed }));
          }
        },
        () => {
          // EOSE for settings (no-op)
        },
      );

      publishPending();
    },
    [storeEvent, publishPending],
  );

  React.useEffect(() => {
    if (pubkey && unlocked && !poolRef.current) startSub(pubkey);
  }, [pubkey, unlocked, startSub]);

  React.useEffect(() => {
    const onOnline = () => {
      if (poolRef.current) {
        poolRef.current.connect();
      } else if (pubkey && unlocked) {
        startSub(pubkey);
      }
      publishPending();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [pubkey, unlocked, startSub, publishPending]);

  const prevUnlocked = React.useRef(unlocked);
  React.useEffect(() => {
    if (prevUnlocked.current && !unlocked) {
      clearDb();
      setEvents([]);
      poolRef.current = null;
    }
    prevUnlocked.current = unlocked;
  }, [unlocked, clearDb]);

  const prevPubkey = React.useRef<string | null>(pubkey);
  React.useEffect(() => {
    if (prevPubkey.current && !pubkey) {
      clearDb();
      setEvents([]);
      poolRef.current = null;
    }
    prevPubkey.current = pubkey;
  }, [pubkey, clearDb]);

  const publish = async (
    ev: NostrEvent,
  ): Promise<{ successes: string[]; failures: Record<string, string> }> => {
    if (!poolRef.current && pubkey && unlocked) startSub(pubkey);

    // Optimistic replace by d
    const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
    setEvents((prev) => {
      const i = prev.findIndex(
        (p) => (p.tags.find((t) => t[0] === "d")?.[1] ?? "") === d,
      );
      if (i >= 0) {
        const copy = prev.slice();
        copy[i] = ev;
        return copy;
      }
      return [...prev, ev];
    });
    await storeEvent(ev, 1);

    try {
      const res = await poolRef.current?.publish(ev);
      if (res?.successes?.length) {
        await db.events.update(ev.id, { pending: 0 });
      }
      return res ?? { successes: [], failures: {} };
    } catch (e) {
      return { successes: [], failures: { _error: String(e) } };
    }
  };

  // Save settings (build + publish settings event)
  const saveSettings = async (next: Settings) => {
    if (!pubkey) throw new Error("No pubkey");
    const ev = await buildSettingsEvent(pubkey, next);
    // optimistic update
    setSettings(next);
    await poolRef.current?.publish(ev);
  };

  const deleteCategory = async (cat: string) => {
    const nextCategories = settings.categories.filter((c) => c !== cat);
    await saveSettings({ ...settings, categories: nextCategories });
  };

  React.useEffect(() => {
    if (!unlocked || settings.autolockSec === null) return;
    const reset = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        lockVault();
        setUnlocked(false);
      }, settings.autolockSec! * 1000);
    };
    const events = ["mousemove", "keydown"] as const;
    events.forEach((ev) => window.addEventListener(ev, reset));
    reset();
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, reset));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [unlocked, settings.autolockSec]);

  if (!pubkey) {
    return <Login onConnected={(pk) => setPubkey(pk)} />;
  }

  if (!unlocked) {
    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <Unlock onUnlocked={handleUnlocked} />
        <div className="max-w-md mx-auto text-center text-xs text-slate-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-3xl font-semibold inline-flex">
          <LogoIcon height="34" width="36" /> NostrPass
        </div>
        <div className="flex items-center gap-3">
          {/* Avatar + name + muted npub */}
          {npub && <ProfileBadge npub={npub} profile={profile} />}
        </div>
      </header>

      {/* Table of items (search/sort/edit/delete/restore) + New Login + Settings control */}
      <section>
        <ItemList
          events={events}
          pubkey={pubkey!}
          onPublish={publish}
          onNewLogin={() => setShowNewLogin(true)}
          settings={settings}
          onOpenSettings={() => setShowSettings(true)}
          onSaveSettings={saveSettings}
        />
      </section>

      {/* Modal for new login */}
      <NewLoginModal
        open={showNewLogin}
        onClose={() => setShowNewLogin(false)}
        pubkey={pubkey!}
        onPublish={publish}
        settings={settings}
        onSaveSettings={saveSettings}
      />

      {/* Settings modal */}
      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        initial={settings}
        onSave={saveSettings}
      />
    </div>
  );
}
