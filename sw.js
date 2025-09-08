const CACHE_NAME = "nostrpass-cache-v1";
const OFFLINE_URLS = [
  "./",
  "./index.html",
  "./favicon.ico",
  "./manifest.webmanifest",
];

// Only these paths will ever be cached by the fetch handler.
// Anything outside of this list will bypass the cache.
const CACHE_WHITELIST = [
  "/",
  "/index.html",
  "/favicon.ico",
  "/icon.svg",
  "/manifest.webmanifest",
];

// Requests matching any of these patterns are explicitly excluded
// from the cache. This is useful for API calls or user specific data.
const CACHE_BLACKLIST = [/^\/api\//, /^\/user\//];
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of OFFLINE_URLS) {
        try {
          await cache.add(url);
        } catch (err) {
          console.warn("Failed to cache", url, err);
        }
      }
    }),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // Skip cross-origin requests entirely.
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isWhitelisted = CACHE_WHITELIST.some((p) => path.startsWith(p));
  const isBlacklisted = CACHE_BLACKLIST.some((r) => r.test(path));

  // If the request isn't for a known static asset or is blacklisted,
  // let the network handle it without caching.
  if (!isWhitelisted || isBlacklisted) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request)),
  );
});
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-pending") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ type: "sync" }));
      }),
    );
  }
});
