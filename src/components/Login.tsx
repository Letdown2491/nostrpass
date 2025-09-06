import React from "react";
import { onSignerConnect } from "../state/vault";
import { LogoIcon } from "./Icons";
export default function Login({
  onConnected,
}: {
  onConnected: (pubkey: string, relay?: string | null) => void;
}) {
  const [err, setErr] = React.useState<string | null>(null);
  const [useDefaultRelays, setUseDefaultRelays] = React.useState(true);
  const [customRelay, setCustomRelay] = React.useState("");
  const connect = async () => {
    try {
      let relay: string | null = null;
      if (!useDefaultRelays) {
        const trimmed = customRelay.trim();
        if (!/^wss?:\/\//.test(trimmed)) {
          setErr("Invalid relay URL");
          return;
        }
        relay = trimmed;
      }
      const pk = await onSignerConnect();
      onConnected(pk, relay);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };
  return (
    <div className="max-w-md mx-auto mt-24 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <h1 className="text-5xl font-semibold inline-flex">
        <LogoIcon height={48} width={48} /> NostrPass
      </h1>
      <p className="text-sm text-slate-400">
        Welcome to NostrPass, a Nostr-enabled password manager.
      </p>
      <button className="primary w-full py-2" onClick={connect}>
        Connect Nostr Signer
      </button>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useDefaultRelays}
          className="accent-indigo-600"
          onChange={(e) => setUseDefaultRelays(e.target.checked)}
        />
        Use default relay options
      </label>
      {!useDefaultRelays && (
        <div className="space-y-1">
          <input
            className="w-full"
            placeholder="wss://relay.nostrpass.xyz"
            value={customRelay}
            onChange={(e) => setCustomRelay(e.target.value)}
            pattern="^wss?://.*$"
            title="Relay URLs must start with ws:// or wss://"
          />
          {customRelay.trim().startsWith("ws://") && (
            <div className="text-xs text-amber-400">
              Please note that you have chosen an insecure relay.
            </div>
          )}
        </div>
      )}
      {err && <div className="text-rose-400 text-sm">{err}</div>}
      <p className="text-sm  text-slate-500">
        The NostrPass relay will be used by default for first time users. If you
        are a returning user, you will be connected to the relays specified in
        your Settings page.
      </p>
    </div>
  );
}
