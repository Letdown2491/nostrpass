import React from "react";
import type { NostrEvent } from "../lib/types";
import { buildItemEvent } from "../state/vault";

type PublishResult = { successes: string[]; failures: Record<string, string> };

export default function EditLoginModal({
  open,
  onClose,
  pubkey,
  onPublish,
  item,
}: {
  open: boolean;
  onClose: () => void;
  pubkey: string;
  onPublish: (ev: NostrEvent) => Promise<PublishResult>;
  item: any | null;
}) {
  const [title, setTitle] = React.useState("");
  const [site, setSite] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totpSecret, setTotpSecret] = React.useState(""); // 2FA secret (Base32)
  const [notes, setNotes] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showTotpSecret, setShowTotpSecret] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<{
    ok: boolean | null;
    text: string;
  }>({ ok: null, text: "" });

  React.useEffect(() => {
    if (!open || !item) return;
    setTitle(item.title ?? "");
    setSite(item.site ?? "");
    setUsername(item.username ?? "");
    setPassword(item.password ?? "");
    setTotpSecret(item.totpSecret ?? "");
    setNotes(item.notes ?? "");
    setShowPassword(false);
    setShowTotpSecret(false);
    setStatus({ ok: null, text: "" });
  }, [open, item]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const lastUpdated = React.useMemo(() => {
    if (!item) return null;
    const sec = item.updatedAt ?? item.createdAt;
    if (!sec) return null;
    return new Date(sec * 1000).toLocaleString();
  }, [item]);

  if (!open || !item) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus({ ok: null, text: "" });

    const now = Math.floor(Date.now() / 1000);
    const body = {
      ...item,
      title,
      site,
      username,
      password,
      totpSecret, // persist 2FA secret
      notes,
      updatedAt: now,
      version: (item.version ?? 0) + 1,
      deleted: false,
    };

    try {
      const ev = await buildItemEvent(item.d, body, pubkey);
      const res = await onPublish(ev);
      const okCount = res?.successes?.length || 0;
      if (okCount > 0) {
        setStatus({ ok: true, text: "Saved" });
        onClose();
      } else {
        const failCount = Object.keys(res?.failures || {}).length;
        setStatus({
          ok: false,
          text: failCount
            ? `No relay accepted write (${failCount} failed)`
            : "No confirmation received",
        });
      }
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message || "Failed to publish" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={stop}
      >
        <div className="text-lg font-semibold mb-4">
          Edit Login
          {lastUpdated && (
            <div className="text-xs text-slate-500">
              Last updated on {lastUpdated}
            </div>
          )}
        </div>
        <form className="space-y-3" onSubmit={submit}>
          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">Title</div>
            <input
              className="w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm block">
              <div className="text-slate-400 text-xs mb-1">Site</div>
              <input
                className="w-full"
                value={site}
                onChange={(e) => setSite(e.target.value)}
                required
              />
            </label>
            <label className="text-sm block">
              <div className="text-slate-400 text-xs mb-1">Username</div>
              <input
                className="w-full"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
          </div>

          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">Password</div>
            <div className="flex items-stretch gap-2">
              <input
                className="w-full"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          {/* 2FA Secret Key with Show/Hide */}
          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">2FA Secret Key</div>
            <div className="flex items-stretch gap-2">
              <input
                className="w-full"
                type={showTotpSecret ? "text" : "password"}
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                placeholder="e.g. JBSWY3DPEHPK3PXP"
              />
              <button
                type="button"
                className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
                onClick={() => setShowTotpSecret((s) => !s)}
                aria-pressed={showTotpSecret}
                title={showTotpSecret ? "Hide secret" : "Show secret"}
              >
                {showTotpSecret ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">Notes</div>
            <textarea
              className="w-full min-h-[80px] resize-y px-3 py-2 rounded-lg border border-slate-700 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-600"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for this login…"
            />
          </label>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-1 rounded-lg border border-slate-600 hover:bg-slate-600/10 disabled:opacity-50"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg border border-emerald-600 text-emerald-300 hover:bg-emerald-600/10 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? "Saving…" : "Encrypt & Publish"}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            {status.text && (
              <div
                className={`text-xs ${
                  status.ok === false
                    ? "text-rose-400"
                    : status.ok === true
                      ? "text-emerald-400"
                      : "text-slate-400"
                }`}
              >
                {status.text}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
