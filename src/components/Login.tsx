import React from "react";
import { onSignerConnect, onRemoteSignerConnect } from "../state/vault";
import { DEFAULT_SETTINGS } from "../state/settings";
import { LogoIcon } from "./Icons";

const REMOTE_SIGNER_PUBKEY =
  ((import.meta as any).env.VITE_REMOTE_SIGNER_PUBKEY as string) || "";
export default function Login({
  onConnected,
}: {
  onConnected: (pubkey: string, relay?: string | null) => void;
}) {
  const [err, setErr] = React.useState<string | null>(null);
  const [useDefaultRelays, setUseDefaultRelays] = React.useState(true);
  const [customRelay, setCustomRelay] = React.useState("");
  const [remote, setRemote] = React.useState(false);
  const [ncUrl, setNcUrl] = React.useState("");
  const [status, setStatus] = React.useState<
    "idle" | "connecting" | "connected" | "error"
  >("idle");

  const connectLocal = async () => {
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
  const connectRemote = async () => {
    setErr(null);
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
      const relays = relay ? [relay] : DEFAULT_SETTINGS.relays;
      setStatus("connecting");
      const pk = await onRemoteSignerConnect(relays, REMOTE_SIGNER_PUBKEY);
      setStatus("connected");
      onConnected(pk, relay);
    } catch (e: any) {
      setStatus("error");
      setErr(e.message || String(e));
      setRemote(true); // show manual URL field on failure
    }
  };
  const connectManual = async () => {
    setErr(null);
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
      setStatus("connecting");
      const pk = await onSignerConnect(ncUrl.trim());
      setStatus("connected");
      onConnected(pk, relay);
    } catch (e: any) {
      setStatus("error");
      setErr(e.message || String(e));
    }
  };
  return (
    <div className="max-w-md mx-auto mt-24 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <h1 className="text-5xl font-semibold inline-flex">
        <LogoIcon height={48} width={48} /> NostrPass
      </h1>
      <p className="text-sm">
        NostrPass is a Nostr-enabled password manager where you control your
        data. Choose you login method to continue.
      </p>
      {!remote ? (
        <>
          <button className="primary w-full py-2" onClick={connectLocal}>
            Connect via Extension
          </button>
          <button
            className="primary w-full py-2"
            onClick={connectRemote}
            disabled={status === "connecting"}
          >
            Connect via Remote Signer
          </button>
          {status === "connecting" && (
            <div className="text-sm text-slate-200">Connecting…</div>
          )}
          {status === "error" && err && (
            <div className="text-rose-400 text-sm">{err}</div>
          )}
        </>
      ) : (
        <div className="space-y-2">
          <input
            className="w-full"
            placeholder="nostrconnect://..."
            value={ncUrl}
            onChange={(e) => setNcUrl(e.target.value)}
          />
          {status === "connecting" && (
            <div className="text-sm text-slate-200">Connecting…</div>
          )}
          {status === "connected" && (
            <div className="text-sm text-emerald-400">Connected</div>
          )}
          {status === "error" && err && (
            <div className="text-rose-400 text-sm">{err}</div>
          )}
          <div className="flex gap-2">
            <button
              className="primary w-full py-2"
              onClick={connectManual}
              disabled={status === "connecting"}
            >
              Connect
            </button>
            <button
              className="w-full py-2 rounded-lg border border-slate-600 hover:bg-slate-600/10"
              onClick={() => {
                setRemote(false);
                setNcUrl("");
                setStatus("idle");
                setErr(null);
              }}
              disabled={status === "connecting"}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
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
      {status !== "error" && err && (
        <div className="text-rose-400 text-sm">{err}</div>
      )}{" "}
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
