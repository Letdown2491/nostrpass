import React from "react";
import { v4 as uuidv4 } from "uuid";
import type { NostrEvent } from "../lib/types";
import { buildItemEvent } from "../state/vault";
import type { Settings } from "../state/settings";
import { generatePassword } from "../lib/crypto";

type PublishResult = { successes: string[]; failures: Record<string, string> };

export default function NewLoginModal({
  open,
  onClose,
  pubkey,
  onPublish,
  settings,
  onSaveSettings,
}: {
  open: boolean;
  onClose: () => void;
  pubkey: string;
  onPublish: (ev: NostrEvent) => Promise<PublishResult>;
  settings: Settings;
  onSaveSettings: (next: Settings) => Promise<void>;
}) {
  const [title, setTitle] = React.useState("");
  const [site, setSite] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [totpSecret, setTotpSecret] = React.useState(""); // 2FA secret (Base32)
  const [notes, setNotes] = React.useState("");
  const defaultCategory = settings.categories.includes("Personal")
    ? "Personal"
    : "Uncategorized";
  const [category, setCategory] = React.useState(defaultCategory);
  const [newCat, setNewCat] = React.useState("");
  const [addingCategory, setAddingCategory] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showTotpSecret, setShowTotpSecret] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<{
    ok: boolean | null;
    text: string;
  }>({ ok: null, text: "" });

  const sortedCategories = React.useMemo(
    () => [...(settings.categories || [])].sort((a, b) => a.localeCompare(b)),
    [settings.categories],
  );

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!open) return;
    setShowPassword(false);
    setShowTotpSecret(false);
    setStatus({ ok: null, text: "" });
    setCategory(defaultCategory);
    setNewCat("");
    setAddingCategory(false);
  }, [open, defaultCategory]);

  if (!open) return null;

  const reset = () => {
    setTitle("");
    setSite("");
    setUsername("");
    setPassword("");
    setTotpSecret("");
    setNotes("");
    setCategory(defaultCategory);
    setNewCat("");
    setAddingCategory(false);
    setShowPassword(false);
    setShowTotpSecret(false);
    setStatus({ ok: null, text: "" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setStatus({ ok: null, text: "" });

    const id = uuidv4();
    const d = `com.you.pm:item:${id}`;
    const now = Math.floor(Date.now() / 1000);
    const chosenCategory = settings.categories.includes(category)
      ? category
      : "Uncategorized";
    if (chosenCategory !== category) setCategory(chosenCategory);
    const item = {
      id,
      type: "login",
      title,
      site,
      username,
      password,
      totpSecret, // <-- new field
      notes,
      category: chosenCategory,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const ev = await buildItemEvent(d, item, pubkey);
      const res = await onPublish(ev);
      const okCount = res?.successes?.length || 0;
      const failCount = Object.keys(res?.failures || {}).length;
      if (okCount > 0) {
        setStatus({ ok: true, text: "Saved" });
        reset();
        onClose();
      } else if (failCount === 0 || !navigator.onLine) {
        // Treat missing confirmations or offline state as a pending local save
        setStatus({ ok: true, text: "Saved locally (pending)" });
        reset();
        onClose();
      } else {
        setStatus({
          ok: false,
          text: `No relay accepted write (${failCount} failed)`,
        });
      }
    } catch (err: any) {
      if (!navigator.onLine) {
        setStatus({ ok: true, text: "Saved locally (pending)" });
        reset();
        onClose();
      } else {
        setStatus({ ok: false, text: err?.message || "Failed to publish" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addCategory = async () => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (settings.categories.includes(trimmed)) {
      setNewCat("");
      setCategory(trimmed);
      setAddingCategory(false);
      return;
    }
    const next = [...settings.categories, trimmed].sort((a, b) =>
      a.localeCompare(b),
    );
    await onSaveSettings({ ...settings, categories: next });
    setNewCat("");
    setCategory(trimmed);
    setAddingCategory(false);
  };

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const genPassword = async () => {
    const pw = generatePassword();
    setPassword(pw);
    try {
      await navigator.clipboard.writeText(pw);
      if (settings.clipboardClearSec) {
        setTimeout(() => {
          navigator.clipboard.writeText("").catch((e) => {
            console.error("Failed to clear clipboard", e);
          });
        }, settings.clipboardClearSec * 1000);
      }
    } catch (e) {
      console.error("Failed to copy password", e);
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
        <div className="text-lg font-semibold mb-4">New Login</div>
        <form className="space-y-3" onSubmit={submit}>
          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">Category</div>
            <div className="flex items-center gap-2">
              <select
                className="flex-1 rounded-lg border border-slate-700 bg-transparent px-3 py-1 focus:outline-none"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {sortedCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {!addingCategory && (
                <button
                  type="button"
                  className="px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-slate-300"
                  onClick={() => setAddingCategory(true)}
                  title="Add category"
                >
                  +
                </button>
              )}
            </div>
            {addingCategory && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  className="flex-1 bg-transparent focus:outline-none border border-slate-700 rounded-lg px-3 py-1"
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCategory();
                    }
                  }}
                  placeholder="New Category"
                />
                <button
                  type="button"
                  className="text-emerald-400 hover:text-emerald-300"
                  onClick={addCategory}
                >
                  Add
                </button>
              </div>
            )}
          </label>
          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">Title</div>
            <input
              className="w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          <div className="grid grid-cols-1 gap-3">
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
              <button
                type="button"
                className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
                onClick={genPassword}
                title="Generate password"
              >
                Generate
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

          {status.text && (
            <div
              className={`text-xs mt-2 ${status.ok === false ? "text-rose-400" : status.ok === true ? "text-emerald-400" : "text-slate-400"}`}
            >
              {status.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
