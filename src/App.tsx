import React from "react";
import Login from "./components/Login";
import Unlock from "./components/Unlock";
import ItemList from "./components/ItemList";
import NewLoginModal from "./components/NewLoginModal";
import ProfileBadge from "./components/ProfileBadge";
import { RelayPool } from "./lib/relays";
import type { NostrEvent } from "./lib/types";
import { toNpub } from "./lib/npub";
import { parseProfileEvent, type Profile } from "./lib/profile";

const DEFAULT_RELAYS = [
  // Keep your primary relay(s) here
  "wss://premium.primal.net",
  // 'ws://127.0.0.1:3355',
];

export default function App() {
  const [pubkey, setPubkey] = React.useState<string | null>(null);
  const [unlocked, setUnlocked] = React.useState(false);
  const [events, setEvents] = React.useState<NostrEvent[]>([]);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [showNewLogin, setShowNewLogin] = React.useState(false);

  const poolRef = React.useRef<RelayPool | null>(null);
  const npub = React.useMemo(() => (pubkey ? toNpub(pubkey) : ""), [pubkey]);

  const startSub = React.useCallback((pk: string) => {
    const pool = new RelayPool(DEFAULT_RELAYS);
    pool.connect();
    poolRef.current = pool;

    // Subscribe to parameterized replaceable app data (kind 30078)
    const dataFilters = [{ authors: [pk], kinds: [30078], limit: 2000 }];
    pool.subscribe(
      dataFilters,
      (ev) => {
        const d = ev.tags.find((t) => t[0] === "d")?.[1] ?? "";
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
          // keep the newest profile we’ve seen
          if ((p.created_at ?? 0) > (cur.created_at ?? 0)) return p;
          return cur;
        });
      },
      () => {
        // EOSE for profile
      },
    );
  }, []);

  React.useEffect(() => {
    if (pubkey && !poolRef.current) startSub(pubkey);
  }, [pubkey, startSub]);

  const publish = async (
    ev: NostrEvent,
  ): Promise<{ successes: string[]; failures: Record<string, string> }> => {
    if (!poolRef.current && pubkey) startSub(pubkey);

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

    try {
      const res = await poolRef.current?.publish(ev);
      return res ?? { successes: [], failures: {} };
    } catch (e) {
      return { successes: [], failures: { _error: String(e) } };
    }
  };

  if (!pubkey) {
    return (
      <Login
        onConnected={(pk) => {
          setPubkey(pk);
        }}
      />
    );
  }

  if (!unlocked) {
    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <Unlock
          onUnlocked={() => {
            setUnlocked(true);
          }}
        />
        <div className="max-w-md mx-auto text-center text-xs text-slate-500">
          After unlocking, your vault will sync from the configured relays and
          decrypt locally.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="text-lg font-semibold">🔐 NostrPass</div>
        <div className="flex items-center gap-3">
          {/* Avatar + name + muted npub */}
          {npub && <ProfileBadge npub={npub} profile={profile} />}
        </div>
      </header>

      {/* Table of items (search/sort/edit/delete/restore) */}
      <section>
        <ItemList
          events={events}
          pubkey={pubkey!}
          onPublish={publish}
          onNewLogin={() => setShowNewLogin(true)}
        />
      </section>

      {/* Modal for new login */}
      <NewLoginModal
        open={showNewLogin}
        onClose={() => setShowNewLogin(false)}
        pubkey={pubkey!}
        onPublish={publish}
      />
    </div>
  );
}
