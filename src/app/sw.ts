/// <reference lib="webworker" />
import { defaultCache } from "@serwist/turbopack/worker";
import { CacheFirst, ExpirationPlugin, Serwist, type PrecacheEntry, type SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/"),
      handler: new CacheFirst({
        cacheName: "static-assets",
        plugins: [new ExpirationPlugin({ maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 })],
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

// The first page loads before this worker controls it, so its HTML never went through the runtime cache. On install,
// fetch the open windows' URLs through the same route a navigation takes (NetworkFirst), so a page seen once also opens
// offline. Best effort: a failed fetch must never fail the install.
self.addEventListener("install", (event) => {
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windows) => Promise.allSettled(windows.map((w) => serwist.handleRequest({ request: new Request(w.url), event })))),
  );
});

serwist.addEventListeners();
