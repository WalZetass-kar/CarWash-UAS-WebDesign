const CACHE_NAME = "kilapkendaraan-cache-v2";
const OFFLINE_URLS = ["/", "/login"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldHandleRequest(event.request)) return;

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request) || caches.match("/")));
});

function shouldHandleRequest(request) {
  if (request.method !== "GET") return false;
  if (request.mode !== "navigate") return false;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  if (url.searchParams.has("_rsc")) return false;
  if (request.headers.get("RSC") === "1") return false;
  if (request.headers.get("Next-Router-Prefetch")) return false;
  if (request.headers.get("Accept")?.includes("text/x-component")) return false;

  return true;
}
