import React from "react";
import { unlockVault } from "../state/vault";
import { LogoIcon } from "./Icons";

export default function Unlock({ onUnlocked }: { onUnlocked: () => void }) {
  const [pw, setPw] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    return () => setPw("");
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await unlockVault(pw);
      onUnlocked();
    } finally {
      setPw("");
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="max-w-md mx-auto mt-24 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60"
    >
      <h2 className="text-3xl font-semibold inline-flex">
        <LogoIcon height={34} width={36} />
        NostrPass
      </h2>
      <input
        type="password"
        placeholder="Enter vault passphrase to continue"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        className="w-full"
        autoComplete="off"
        required
      />
      <button className="primary w-full py-2" disabled={busy}>
        {busy ? "Unlocking…" : "Unlock"}
      </button>
      <p className="text-xs text-slate-500">
        After unlocking, your vault will sync from the configured relays and
        decrypt locally. Your passphrase never leaves this device.
      </p>
    </form>
  );
}
