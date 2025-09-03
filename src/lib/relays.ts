import type { NostrEvent, PublishResult } from "./types";

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

type RelayFrame = unknown[];

export class RelayPool extends EventTarget {
  private urls: string[] = [];
  private sockets: Map<string, WebSocket> = new Map();
  private queues: Map<string, RelayFrame[]> = new Map();
  private nextSub = 0;

  private debug: boolean;
  private logger: Pick<Console, "log" | "warn">;
  constructor(
    urls: string[] = [],
    debug = false,
    logger: Pick<Console, "log" | "warn"> = console,
  ) {
    super();
    this.urls = urls;
    this.debug = debug;
    this.logger = logger;
  }
  setRelays(urls: string[]) {
    this.urls = urls;
  }

  connect() {
    for (const url of this.urls) {
      if (this.sockets.has(url)) continue;
      try {
        const { protocol } = new URL(url);
        if (protocol !== "wss:") {
          this.logger.warn("[relay] insecure url skipped", url);
          continue;
        }
      } catch (e) {
        this.logger.warn("[relay] invalid url skipped", url, e);
        continue;
      }
      const ws = new WebSocket(url);
      this.queues.set(url, []);

      ws.onopen = () => {
        if (this.debug) this.logger.log("[relay] open", url);
        this.dispatchEvent(new CustomEvent("open", { detail: { url } }));
        const q = this.queues.get(url) ?? [];
        for (const frame of q) {
          if (this.debug) this.logger.log("[relay→send]", url, frame);
          try {
            ws.send(JSON.stringify(frame));
          } catch (e) {
            this.logger.warn("[relay] send error", url, e);
          }
        }
        this.queues.set(url, []);
      };
      ws.onclose = () => {
        if (this.debug) this.logger.log("[relay] close", url);
        this.sockets.delete(url);
        this.dispatchEvent(new CustomEvent("close", { detail: { url } }));
      };
      ws.onerror = (e) => {
        this.logger.warn("[relay] error", url, e);
        this.dispatchEvent(new CustomEvent("error", { detail: { url } }));
      };
      ws.onmessage = (msg) => {
        try {
          if (this.debug)
            this.logger.log(
              "[relay←recv]",
              url,
              JSON.parse(msg.data as string),
            );
        } catch {
          if (this.debug) this.logger.log("[relay←recv]", url, msg.data);
        }
      };
      this.sockets.set(url, ws);
    }
  }

  private sendOrQueue(url: string, frame: RelayFrame) {
    const ws = this.sockets.get(url);
    if (!ws) return;
    if (ws.readyState === WebSocket.OPEN) {
      if (this.debug) this.logger.log("[relay→send]", url, frame);
      ws.send(JSON.stringify(frame));
    } else {
      const q = this.queues.get(url) ?? [];
      q.push(frame);
      this.queues.set(url, q);
      if (this.debug) this.logger.log("[relay→queue]", url, frame);
    }
  }

  private broadcast(frame: RelayFrame) {
    for (const url of this.sockets.keys()) this.sendOrQueue(url, frame);
  }

  close() {
    for (const ws of this.sockets.values()) {
      try {
        ws.close();
      } catch {}
    }
    this.sockets.clear();
    this.queues.clear();
  }

  subscribe(
    filters: Filter[],
    onEvent: (ev: NostrEvent) => void,
    onEOSE?: () => void,
  ): SubHandle {
    const subId = `sub-${this.nextSub++}`;
    const listeners: Array<[WebSocket, (msg: MessageEvent) => void]> = [];

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
          this.logger.warn("[NOTICE]", url, rest);
        }
      } catch {}
    };

    for (const [url, ws] of this.sockets) {
      const fn = handler(url);
      ws.addEventListener("message", fn);
      listeners.push([ws, fn]);
    }
    this.broadcast(["REQ", subId, ...filters]); // queued if needed
    return {
      subId,
      close: () => {
        for (const [ws, fn] of listeners) ws.removeEventListener("message", fn);
        this.broadcast(["CLOSE", subId]);
      },
    };
  }

  publish(ev: NostrEvent): Promise<PublishResult> {
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
