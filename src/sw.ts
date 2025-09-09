/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, skipWaiting } from "workbox-core";

// Narrow the global 'self' for THIS FILE (types only; no runtime code)
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

skipWaiting();
clientsClaim();

// Avoid duplicate precache entries; rely on injectManifest
precacheAndRoute(self.__WB_MANIFEST);

const CACHE_NAME = "nostrpass-cache-v1";

self.addEventListener("fetch", (event: FetchEvent) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  const isIcon =
    event.request.destination === "image" && url.pathname.endsWith(".ico");
  if (!isIcon) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;

      try {
        const res = await fetch(event.request);
        if (res.ok) await cache.put(event.request, res.clone());
        return res;
      } catch {
        return new Response("", { status: 404 });
      }
    })(),
  );
});
