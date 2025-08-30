import type { NostrEvent } from "./types";

type Filter = {
  ids?: string[];
  authors?: string[];
  kinds?: number[];
  "#d"?: string[];
  since?: number;
  until?: number;
  limit?: number;
};

type SubHandle = { subId: string; close: () => void };

export class RelayPool {
  private urls: string[] = [];
  private sockets: Map<string, WebSocket> = new Map();
  private queues: Map<string, any[][]> = new Map();
  private nextSub = 0;

  constructor(urls: string[] = []) {
    this.urls = urls;
  }
  setRelays(urls: string[]) {
    this.urls = urls;
  }

  connect() {
    for (const url of this.urls) {
      if (this.sockets.has(url)) continue;
      const ws = new WebSocket(url);
      this.queues.set(url, []);

      ws.onopen = () => {
        console.log("[relay] open", url);
        const q = this.queues.get(url) ?? [];
        for (const frame of q) {
          console.log("[relay→send]", url, frame);
          try {
            ws.send(JSON.stringify(frame));
          } catch (e) {
            console.warn("[relay] send error", url, e);
          }
        }
        this.queues.set(url, []);
      };
      ws.onclose = () => {
        console.log("[relay] close", url);
        this.sockets.delete(url);
      };
      ws.onerror = (e) => console.warn("[relay] error", url, e);
      ws.onmessage = (msg) => {
        try {
          console.log("[relay←recv]", url, JSON.parse(msg.data as string));
        } catch {
          console.log("[relay←recv]", url, msg.data);
        }
      };
      this.sockets.set(url, ws);
    }
  }

  private sendOrQueue(url: string, frame: any[]) {
    const ws = this.sockets.get(url);
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      console.log("[relay→send]", url, frame);
      ws.send(JSON.stringify(frame));
    } else {
      const q = this.queues.get(url) ?? [];
      q.push(frame);
      this.queues.set(url, q);
      console.log("[relay→queue]", url, frame);
    }
  }

  private broadcast(frame: any[]) {
    for (const url of this.sockets.keys()) this.sendOrQueue(url, frame);
  }

  subscribe(
    filters: Filter[],
    onEvent: (ev: NostrEvent) => void,
    onEOSE?: () => void,
  ): SubHandle {
    const subId = `sub-${this.nextSub++}`;

    const handler = (url: string) => (msg: MessageEvent) => {
      try {
        const data = JSON.parse(msg.data as string);
        if (!Array.isArray(data)) return;
        const [type, ...rest] = data;
        if (type === "EVENT") {
          const [sid, ev] = rest;
          if (sid === subId) onEvent(ev);
        } else if (type === "EOSE") {
          const [sid] = rest;
          if (sid === subId) onEOSE && onEOSE();
        } else if (type === "NOTICE") {
          console.warn("[NOTICE]", url, rest);
        }
      } catch {}
    };

    for (const [url, ws] of this.sockets)
      ws.addEventListener("message", handler(url));
    this.broadcast(["REQ", subId, ...filters]); // queued if needed
    return { subId, close: () => this.broadcast(["CLOSE", subId]) };
  }

  publish(
    ev: NostrEvent,
  ): Promise<{ successes: string[]; failures: Record<string, string> }> {
    return new Promise((resolve) => {
      const oks = new Map<string, { ok: boolean; msg: string }>();
      const cleanupFns: Array<() => void> = [];

      const handler = (url: string) => (msg: MessageEvent) => {
        try {
          const data = JSON.parse(msg.data as string);
          if (!Array.isArray(data)) return;
          const [type, ...rest] = data;
          if (type === "OK") {
            const [id, ok, message] = rest;
            if (id === ev.id)
              oks.set(url, { ok: !!ok, msg: String(message || "") });
          }
        } catch {}
      };

      for (const [url, ws] of this.sockets) {
        const fn = handler(url);
        ws.addEventListener("message", fn);
        cleanupFns.push(() => ws.removeEventListener("message", fn));
      }

      // will queue while CONNECTING, flush on open
      this.broadcast(["EVENT", ev]);

      setTimeout(() => {
        for (const fn of cleanupFns) fn();
        const successes = [...oks.entries()]
          .filter(([, v]) => v.ok)
          .map(([u]) => u);
        const failuresEntries = [...oks.entries()].filter(([, v]) => !v.ok);
        const failures: Record<string, string> = {};
        for (const [u, v] of failuresEntries) failures[u] = v.msg;
        resolve({ successes, failures });
      }, 5000);
    });
  }
}
