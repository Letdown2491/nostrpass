import React from "react";
import { unlockVault } from "../state/vault";
import { LogoIcon } from "./Icons";

export default function Unlock({ onUnlocked }: { onUnlocked: () => void }) {
  const pwRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = pwRef.current;
    let pw = input?.value ?? "";
    setBusy(true);
    try {
      try {
        await unlockVault(pw);
      } finally {
        pw = "";
        if (input) input.value = "";
      }
      onUnlocked();
    } finally {
      setBusy(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="max-w-md mx-auto mt-24 space-y-4 p-6 rounded-2xl border border-slate-800 bg-slate-900/60"
    >
      <h2 className="text-5xl font-semibold inline-flex">
        <LogoIcon height={48} width={48} />
        NostrPass
      </h2>
      <input
        ref={pwRef}
        type="password"
        placeholder="Enter vault passphrase to continue"
        className="w-full"
        autoComplete="off"
        required
      />
      <button className="primary w-full py-2" disabled={busy}>
        {busy ? "Unlocking…" : "Unlock"}
      </button>
      <p className=" text-slate-500">
        After unlocking, your vault will sync from the configured relays and
        decrypt locally. Your passphrase never leaves this device.
      </p>
    </form>
  );
}
