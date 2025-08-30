import React from "react";
import type { Settings } from "../state/settings";

export default function SettingsModal({
  open,
  onClose,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: Settings;
  onSave: (next: Settings) => Promise<void>;
}) {
  const [form, setForm] = React.useState<Settings>(initial);
  const [saving, setSaving] = React.useState(false);
  const [status, setStatus] = React.useState<{
    ok: boolean | null;
    text: string;
  }>({ ok: null, text: "" });

  React.useEffect(() => {
    if (!open) return;
    setForm(initial);
    setSaving(false);
    setStatus({ ok: null, text: "" });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initial, onClose]);

  if (!open) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setStatus({ ok: null, text: "" });
    try {
      await onSave(form);
      setStatus({ ok: true, text: "Saved" });
      onClose();
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message || "Failed to save settings" });
    } finally {
      setSaving(false);
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
        <div className="text-lg font-semibold mb-4">Settings</div>

        <form className="space-y-4" onSubmit={submit}>
          <fieldset className="space-y-2">
            <legend className="text-slate-400 text-xs mb-1">Display</legend>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showDeleted}
                onChange={(e) =>
                  setForm((s) => ({ ...s, showDeleted: e.target.checked }))
                }
              />
              Show deleted
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showFavicons}
                onChange={(e) =>
                  setForm((s) => ({ ...s, showFavicons: e.target.checked }))
                }
              />
              Show favicons
            </label>

            <p className="text-xs text-slate-500">
              Favicons are fetched from a third-party service (DuckDuckGo ip3).
            </p>
          </fieldset>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-1 rounded-lg border border-slate-600 hover:bg-slate-600/10 disabled:opacity-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg border border-emerald-600 text-emerald-300 hover:bg-emerald-600/10 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>

          {status.text && (
            <div
              className={`text-xs mt-2 ${
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
        </form>
      </div>
    </div>
  );
}
