/* eslint-disable no-restricted-globals */
/**
 * OperatorOS service worker (WS-3.5 scaffolding).
 *
 * Strategy: network-first for HTML navigation with a cached offline fallback;
 * stale-while-revalidate for same-origin static assets; pass-through for
 * everything else (API calls, third-party).
 *
 * The cache name embeds a version so a deploy with a new SW evicts the prior
 * cache. Bump CACHE_VERSION when changing PRECACHE_URLS or strategies.
 */

const CACHE_VERSION = "v1";
const RUNTIME_CACHE = `operatoros-runtime-${CACHE_VERSION}`;
const PRECACHE = `operatoros-precache-${CACHE_VERSION}`;

const PRECACHE_URLS = ["/offline.html", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== RUNTIME_CACHE && k !== PRECACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isHtmlNavigation(request) {
  return (
    request.mode === "navigate" ||
    (request.method === "GET" &&
      request.headers.get("accept") &&
      request.headers.get("accept").includes("text/html"))
  );
}

function isStaticAsset(url) {
  return (
    url.origin === self.location.origin &&
    /\.(?:css|js|woff2?|ttf|otf|png|svg|jpg|jpeg|webp|ico)$/i.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only intercept GET. POSTs (form submits, mutations) must always hit the
  // network — caching them would silently swallow user input.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API routes — they're authenticated, dynamic, and small
  // staleness windows would surface wrong compliance data.
  if (url.pathname.startsWith("/api/")) return;

  // Never cache auth callback or share-token routes.
  if (
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/share/") ||
    url.pathname.startsWith("/accountant/") ||
    url.pathname.startsWith("/unsubscribe/")
  ) {
    return;
  }

  if (isHtmlNavigation(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

async function networkFirstWithOfflineFallback(request) {
  try {
    const fresh = await fetch(request);
    // Update runtime cache so the next offline visit gets the latest view.
    const cache = await caches.open(RUNTIME_CACHE);
    cache.put(request, fresh.clone());
    return fresh;
  } catch (_err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match("/offline.html");
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((resp) => {
      if (resp && resp.ok) cache.put(request, resp.clone());
      return resp;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}
