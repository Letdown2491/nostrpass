import React from "react";
import type { NostrEvent } from "../lib/types";
import { buildItemEvent } from "../state/vault";
import type { Settings } from "../state/settings";
import LoginForm from "./LoginForm";
import { useLoginForm, type LoginFormValues } from "../hooks/useLoginForm";

type PublishResult = { successes: string[]; failures: Record<string, string> };

export default function EditLoginModal({
  open,
  onClose,
  pubkey,
  onPublish,
  item,
  settings,
  onSaveSettings,
}: {
  open: boolean;
  onClose: () => void;
  pubkey: string;
  onPublish: (ev: NostrEvent) => Promise<PublishResult>;
  item: any | null;
  settings: Settings;
  onSaveSettings: (next: Settings) => Promise<void>;
}) {
  const form = useLoginForm({
    open,
    settings,
    onSaveSettings,
    initial: item ?? undefined,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<{
    ok: boolean | null;
    text: string;
  }>({ ok: null, text: "" });

  const handleClose = React.useCallback(() => {
    form.reset();
    onClose();
  }, [form, onClose]);

  React.useEffect(() => {
    if (!open) form.reset();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const lastUpdated = React.useMemo(() => {
    if (!item) return null;
    const sec = item.updatedAt ?? item.createdAt;
    if (!sec) return null;
    return new Date(sec * 1000).toLocaleString();
  }, [item]);

  if (!open || !item) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const submit = async (values: LoginFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    setStatus({ ok: null, text: "" });

    const now = Math.floor(Date.now() / 1000);
    const { category: _unused, d: _d, ...rest } = item;
    const body = {
      ...rest,
      title: values.title,
      category: values.category,
      site: values.site,
      username: values.username,
      password: values.password,
      totpSecret: values.totpSecret,
      notes: values.notes,
      updatedAt: now,
      version: (item.version ?? 0) + 1,
      deleted: false,
    };

    try {
      const ev = await buildItemEvent(item.id, body, pubkey);
      onPublish(ev).catch((err) => console.error("Failed to publish", err));
      handleClose();
    } catch (err: any) {
      setStatus({ ok: false, text: err?.message || "Failed to publish" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={handleClose}
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
        <LoginForm
          mode="edit"
          form={form}
          submitting={submitting}
          status={status}
          onSubmit={submit}
          onCancel={handleClose}
        />
      </div>
    </div>
  );
}
