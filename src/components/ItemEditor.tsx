import React from "react";
import { v4 as uuidv4 } from "uuid";
import { buildItemEvent } from "../state/vault";

export default function ItemEditor({
  pubkey,
  onPublish,
}: {
  pubkey: string;
  onPublish: (
    ev: any,
  ) => Promise<{ successes: string[]; failures: Record<string, string> }>;
}) {
  const [title, setTitle] = React.useState("");
  const [site, setSite] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
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
    };
    const d = `com.you.pm:item:${item.id}`;
    const ev = await buildItemEvent(d, item, pubkey);
    onPublish(ev);
    setTitle("");
    setSite("");
    setUsername("");
    setPassword("");
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
        required
      />
      <input
        placeholder="Site"
        value={site}
        onChange={(e) => setSite(e.target.value)}
        className="w-full"
        required
      />
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="w-full"
        required
      />
      <input
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full"
        type="password"
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
