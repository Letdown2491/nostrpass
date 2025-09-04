import React from "react";
import { onSignerConnect } from "../state/vault";
import { LogoIcon } from "./Icons";
export default function Login({
  onConnected,
}: {
  onConnected: (pubkey: string) => void;
}) {
  const [err, setErr] = React.useState<string | null>(null);
  const connect = async () => {
    try {
      const pk = await onSignerConnect();
      onConnected(pk);
    } catch (e: any) {
      setErr(e.message || String(e));
    }
  };
  return (
    <div className="max-w-md mx-auto mt-24 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60">
      <h1 className="text-3xl font-semibold inline-flex">
        <LogoIcon height={36} width={36} /> NostrPass
      </h1>
      <p className="text-sm text-slate-400">
        Welcome to NostrPass, a Nostr-enabled password manager.
      </p>
      <button className="primary w-full py-2" onClick={connect}>
        Connect Nostr Signer
      </button>
      {err && <div className="text-rose-400 text-sm">{err}</div>}
      <p className="text-xs text-slate-500">
        We never see your nsec. Signing is handled by your browser
        extension/signer. Feel free to{" "}
        <a
          href="https://github.com/Letdown2491/nostrpass"
          title="NostrPass on GitHub"
          target="_blank"
          rel="noopener noreferrer"
        >
          review our code
        </a>{" "}
        yourself on GitHub.
      </p>
    </div>
  );
}
