import React from "react";
import { v4 as uuidv4 } from "uuid";
import type { NostrEvent } from "../lib/types";
import { buildItemEvent } from "../state/vault";
import type { Settings } from "../state/settings";
import LoginForm from "./LoginForm";
import { useLoginForm, type LoginFormValues } from "../hooks/useLoginForm";

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
  const form = useLoginForm({ open, settings, onSaveSettings });
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

  if (!open) return null;

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const submit = async (values: LoginFormValues) => {
    if (submitting) return;
    setSubmitting(true);
    setStatus({ ok: null, text: "" });

    const id = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const chosenCategory = settings.categories.includes(values.category)
      ? values.category
      : "Uncategorized";
    if (chosenCategory !== values.category) form.setCategory(chosenCategory);
    const item = {
      id,
      type: "login",
      title: values.title,
      site: values.site,
      username: values.username,
      password: values.password,
      totpSecret: values.totpSecret,
      notes: values.notes,
      category: chosenCategory,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const ev = await buildItemEvent(id, item, pubkey);
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
      className="fixed inset-0 z-40 flex items-center justify-center"
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl"
        role="dialog"
        aria-modal="true"
        onClick={stop}
      >
        <div className="text-lg font-semibold mb-4">New Login</div>
        <LoginForm
          mode="new"
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
