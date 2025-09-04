import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim, skipWaiting } from "workbox-core";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Force the waiting service worker to become the active service worker
skipWaiting();
clientsClaim();

// Precache application shell resources
precacheAndRoute([
  { url: "/index.html", revision: null },
  ...self.__WB_MANIFEST,
]);
