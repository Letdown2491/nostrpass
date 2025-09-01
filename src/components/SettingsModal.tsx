import React from "react";
import {
  DEFAULT_SETTINGS,
  type Settings,
  type TableSortKey,
  type TableSortDir,
} from "../state/settings";

const SORT_KEYS: TableSortKey[] = ["title", "site", "username", "updatedAt"];
const SORT_DIRS: TableSortDir[] = ["asc", "desc"];

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

        <form className="space-y-5" onSubmit={submit}>
          <fieldset className="space-y-3">
            {/* Favicons on/off */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showFavicons}
                onChange={(e) =>
                  setForm((s) => ({ ...s, showFavicons: e.target.checked }))
                }
              />
              Fetch remote favicons
            </label>
            <p className="text-xs text-slate-500">
              Favicons are loaded from a remote service. Disable for stricter
              privacy.
            </p>

            {/* Favicon source */}
            <div className="text-sm space-y-2">
              <div className="text-slate-400 text-xs">Favicon source</div>
              <select
                className="w-full sm:max-w-xs"
                value={form.favicon.source}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    favicon: {
                      ...s.favicon,
                      source: e.target.value as "ddg" | "custom",
                    },
                  }))
                }
              >
                <option value="ddg">DuckDuckGo ip3</option>
                <option value="custom">Custom proxy base URL</option>
              </select>
              {form.favicon.source === "custom" && (
                <input
                  className="w-full"
                  placeholder="https://icons.example.com/ip3/"
                  value={form.favicon.customBase || ""}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      favicon: { ...s.favicon, customBase: e.target.value },
                    }))
                  }
                />
              )}
              <p className="text-xs text-slate-500">
                Custom base should point to a service that returns{" "}
                <code>.ico</code> for <em>hostname</em>. The app will request{" "}
                <code>
                  {`<base>`}
                  {`<hostname>`}.ico
                </code>
                .
              </p>
            </div>

            {/* Truncate long fields */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.truncateFields}
                onChange={(e) =>
                  setForm((s) => ({ ...s, truncateFields: e.target.checked }))
                }
              />
              Truncate long Title/Site with tooltip
            </label>

            {/* Default sort */}
            <div className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <div className="text-slate-400 text-xs mb-1">
                  Default sort key
                </div>
                <select
                  className="w-full"
                  value={form.defaultSort.key}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      defaultSort: {
                        ...s.defaultSort,
                        key: e.target.value as TableSortKey,
                      },
                    }))
                  }
                >
                  {SORT_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <div className="text-slate-400 text-xs mb-1">
                  Default sort direction
                </div>
                <select
                  className="w-full"
                  value={form.defaultSort.dir}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      defaultSort: {
                        ...s.defaultSort,
                        dir: e.target.value as TableSortDir,
                      },
                    }))
                  }
                >
                  {SORT_DIRS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Clipboard clear */}
            <div className="text-sm space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.clipboardClearSec !== null}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      clipboardClearSec: e.target.checked
                        ? (s.clipboardClearSec ??
                          DEFAULT_SETTINGS.clipboardClearSec)
                        : null,
                    }))
                  }
                />
                Clear clipboard after X seconds
              </label>
              {form.clipboardClearSec !== null && (
                <input
                  type="number"
                  min={1}
                  className="w-full sm:max-w-xs"
                  value={form.clipboardClearSec}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      clipboardClearSec: Number(e.target.value),
                    }))
                  }
                />
              )}
              <p className="text-xs text-slate-500">
                Automatically clear clipboard after X seconds
              </p>
            </div>

            {/* Auto-lock */}
            <div className="text-sm space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.autolockSec !== null}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      autolockSec: e.target.checked
                        ? (s.autolockSec ?? DEFAULT_SETTINGS.autolockSec)
                        : null,
                    }))
                  }
                />
                Lock after X seconds of inactivity
              </label>
              {form.autolockSec !== null && (
                <input
                  type="number"
                  min={1}
                  className="w-full sm:max-w-xs"
                  value={form.autolockSec}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      autolockSec: Number(e.target.value),
                    }))
                  }
                />
              )}
              <p className="text-xs text-slate-500">
                Automatically lock the vault after the given number of idle
                seconds.
              </p>
            </div>

            {/* Show deleted */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showDeleted}
                onChange={(e) =>
                  setForm((s) => ({ ...s, showDeleted: e.target.checked }))
                }
              />
              Display deleted items
            </label>
            <p className="text-xs text-slate-500">
              Your relay may not support note deletion so we use some magic to
              hide them.
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
