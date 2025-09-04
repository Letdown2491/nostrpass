import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, skipWaiting } from "workbox-core";

declare const self: {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

interface FetchEvent extends Event {
  readonly request: Request;
  respondWith(response: Promise<Response> | Response): void;
}

// Force the waiting service worker to become the active service worker
skipWaiting();
clientsClaim();

// Precache application shell resources
precacheAndRoute([
  { url: "/index.html", revision: null },
  ...self.__WB_MANIFEST,
]);

const CACHE_NAME = "nostrpass-cache-v1";

const sw = self as any;

sw.addEventListener("fetch", (event: Event) => {
  const fetchEvent = event as FetchEvent;
  if (fetchEvent.request.method !== "GET") return;

  const url = new URL(fetchEvent.request.url);
  const isIcon =
    fetchEvent.request.destination === "image" && url.pathname.endsWith(".ico");
  if (!isIcon) return;

  fetchEvent.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(fetchEvent.request);
      if (cached) return cached;
      try {
        const response = await fetch(fetchEvent.request);
        if (response.ok) cache.put(fetchEvent.request, response.clone());
        return response;
      } catch {
        return new Response("", { status: 404 });
      }
    }),
  );
});
