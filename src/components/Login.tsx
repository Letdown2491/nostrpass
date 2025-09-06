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
      <p className="text-sm">
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
            placeholder="wss://relay.nostrpass.me"
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
      <p className="text-sm text-slate-200">
        Sign up for{" "}
        <a
          href="https://relay.nostrpass.me"
          title="NostrPass Relay"
          rel="noopener noreferrer"
        >
          <span className="text-indigo-500">our premium relay</span>
        </a>{" "}
        to use the app defaults and support the project, or if you want to use
        your own, uncheck the box above and enter it. After sign in, your custom
        relay will be set as default so this is a one time input only.
      </p>
    </div>
  );
}
