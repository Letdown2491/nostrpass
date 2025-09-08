import React from "react";
import TotpQrScanner from "./TotpQrScanner";
import { ShowIcon, HideIcon, GenerateIcon, ScanCodeIcon } from "./Icons";
import type {
  LoginFormValues,
  UseLoginFormReturn,
} from "../hooks/useLoginForm";

export default function LoginForm({
  mode,
  form,
  submitting,
  status,
  onSubmit,
  onCancel,
}: {
  mode: "new" | "edit";
  form: UseLoginFormReturn;
  submitting: boolean;
  status: { ok: boolean | null; text: string };
  onSubmit: (
    values: LoginFormValues,
    helpers: { reset: () => void },
  ) => void | Promise<void>;
  onCancel: () => void;
}) {
  const {
    values: { title, site, username, password, totpSecret, notes, category },
    setTitle,
    setSite,
    setUsername,
    setPassword,
    setTotpSecret,
    setNotes,
    setCategory,
    passwordScore,
    newCat,
    setNewCat,
    addingCategory,
    setAddingCategory,
    savingCategory,
    showPassword,
    setShowPassword,
    showTotpSecret,
    setShowTotpSecret,
    showScanner,
    setShowScanner,
    scannedSecret,
    sortedCategories,
    genPassword,
    addCategory,
    handleQrScan,
    copySecret,
    reset,
  } = form;

  const strengthLabels = ["Too weak", "Weak", "Medium", "Strong"];
  const strengthColors = [
    "bg-rose-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-emerald-500",
  ];
  const strengthText = [
    "text-rose-400",
    "text-orange-400",
    "text-yellow-400",
    "text-emerald-400",
  ];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form.values, { reset });
  };

  return (
    <>
      {mode === "new" && showScanner && (
        <TotpQrScanner
          onScan={handleQrScan}
          onClose={() => setShowScanner(false)}
        />
      )}
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
                className="flex-1 bg-transparent focus:outline-none border border-slate-700 rounded-lg px-3 py-1 disabled:opacity-50"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
                placeholder="New Category"
                disabled={savingCategory}
              />
              <button
                type="button"
                className="text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
                onClick={addCategory}
                disabled={savingCategory}
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
              autoComplete="off"
              required
            />
          </label>
          <label className="text-sm block">
            <div className="text-slate-400 text-xs mb-1">Username</div>
            <input
              className="w-full"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="off"
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
              autoComplete="off"
              required
            />
            <button
              type="button"
              className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
              onClick={() => setShowPassword((s) => !s)}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <HideIcon height="16" width="16" />
              ) : (
                <ShowIcon height="16" width="16" />
              )}
            </button>
            <button
              type="button"
              className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
              onClick={genPassword}
              title="Generate password"
            >
              <GenerateIcon height="16" width="16" />
            </button>
          </div>
          {password && (
            <div className="mt-1">
              <div className="w-full h-1 bg-slate-700 rounded">
                <div
                  className={`h-full rounded ${strengthColors[passwordScore]}`}
                  style={{ width: `${((passwordScore + 1) / 4) * 100}%` }}
                />
              </div>
              <div className={`text-xs mt-1 ${strengthText[passwordScore]}`}>
                {strengthLabels[passwordScore]}
              </div>
            </div>
          )}
        </label>

        <label className="text-sm block">
          <div className="text-slate-400 text-xs mb-1">2FA Secret Key</div>
          <div className="flex items-stretch gap-2">
            <input
              className="w-full"
              type={showTotpSecret ? "text" : "password"}
              value={totpSecret}
              onChange={(e) => setTotpSecret(e.target.value)}
              autoComplete="off"
              placeholder="e.g. JBSWY3DPEHPK3PXP"
            />
            <button
              type="button"
              className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
              onClick={() => setShowTotpSecret((s) => !s)}
              aria-pressed={showTotpSecret}
              title={showTotpSecret ? "Hide secret" : "Show secret"}
            >
              {showTotpSecret ? (
                <HideIcon height="16" width="16" />
              ) : (
                <ShowIcon height="16" width="16" />
              )}
            </button>
            {mode === "new" && (
              <button
                type="button"
                className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
                onClick={() => setShowScanner(true)}
                title="Scan QR code"
              >
                <ScanCodeIcon height="16" width="16" />
              </button>
            )}
          </div>
          {mode === "new" && scannedSecret && (
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono break-all text-xs">
                {scannedSecret}
              </span>
              <button
                type="button"
                className="px-3 rounded-lg border border-slate-600 hover:bg-slate-600/10"
                onClick={copySecret}
              >
                Copy Secret
              </button>
            </div>
          )}
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
            onClick={onCancel}
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
    </>
  );
}
