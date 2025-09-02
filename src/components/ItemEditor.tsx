import React from "react";
import { v4 as uuidv4 } from "uuid";
import { buildItemEvent } from "../state/vault";
import type { LoginItem, NostrEvent, PublishResult } from "../lib/types";

export default function ItemEditor({
  pubkey,
  onPublish,
}: {
  pubkey: string;
  onPublish: (ev: NostrEvent) => Promise<PublishResult>;
}) {
  const [title, setTitle] = React.useState("");
  const [site, setSite] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [status, setStatus] = React.useState<{
    ok: boolean | null;
    text: string;
  }>({
    ok: null,
    text: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item: LoginItem = {
      id: uuidv4(),
      type: "login",
      title,
      tags: [],
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
      version: 1,
      site,
      username,
      password,
      category: "",
    };
    const d = `com.you.pm:item:${item.id}`;
    try {
      const ev = await buildItemEvent(d, item, pubkey);
      const res = await onPublish(ev);
      const okCount = res?.successes?.length || 0;
      const failCount = Object.keys(res?.failures || {}).length;
      if (okCount > 0) {
        setStatus({ ok: true, text: "Saved" });
        setTitle("");
        setSite("");
        setUsername("");
        setPassword("");
      } else if (failCount === 0 || !navigator.onLine) {
        setStatus({ ok: true, text: "Saved locally (pending)" });
        setTitle("");
        setSite("");
        setUsername("");
        setPassword("");
      } else {
        setStatus({
          ok: false,
          text: failCount
            ? `No relay accepted write (${failCount} failed)`
            : "No confirmation received",
        });
      }
    } catch (err: unknown) {
      if (!navigator.onLine) {
        setStatus({ ok: true, text: "Saved locally (pending)" });
        setTitle("");
        setSite("");
        setUsername("");
        setPassword("");
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to publish";
        setStatus({ ok: false, text: message });
      }
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-2 p-3 rounded-xl border border-slate-800 bg-slate-900/40"
    >
      <div className="font-semibold">New Login</div>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full"
        autoComplete="off"
        required
      />
      <input
        placeholder="Site"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        className="w-full"
        autoComplete="off"
        required
      />
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full"
        autoComplete="off"
        required
      />
      <input
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full"
        type="password"
        autoComplete="off"
        required
      />
      <button className="primary py-2">Encrypt & Publish</button>
      {status.text && (
        <div
          className={`text-xs mt-1 ${status.ok === false ? "text-rose-400" : status.ok === true ? "text-emerald-400" : "text-slate-400"}`}
        >
          {status.text}
        </div>
      )}
    </form>
  );
}
