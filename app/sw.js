// Caches the whole app at kickoff so relays still open with no signal.
// Always tries the network first, so updates show up right away; the cache is the fallback.
const VERSION = "roothog-v4";
const FILES = [
  "./",
  "index.html",
  "css/app.css",
  "js/config.js",
  "js/vendor/supabase.js",
  "js/sha256.js",
  "js/answer-hashes.js",
  "js/content.js",
  "js/scenes.js",
  "js/audio.js",
  "js/backend.js",
  "js/app.js",
  "fonts/overpass-latin-400-normal.woff2",
  "fonts/overpass-latin-600-normal.woff2",
  "fonts/overpass-latin-800-normal.woff2",
  "fonts/overpass-mono-latin-400-normal.woff2",
  "fonts/overpass-mono-latin-600-normal.woff2",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return; // Supabase calls go straight to the network
  event.respondWith(
    // no-cache: always ask GitHub whether the file changed (a quick 304 if not), instead of
    // trusting the browser's 10-minute copy. Without it, updates can take 10 minutes to appear.
    fetch(event.request, { cache: "no-cache" })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request, { ignoreSearch: true }))
  );
});
