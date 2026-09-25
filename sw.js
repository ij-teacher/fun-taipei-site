const CACHE = "fun-taipei-pages-v4-20260925";
const HOME = new URL("./", self.location).href; const VIDEO = new URL("fun-taipei-no-logo-v5.mp4", HOME).href; const CORE = [HOME, VIDEO, new URL("og.png", HOME).href, new URL("favicon.svg", HOME).href, new URL("manifest.webmanifest", HOME).href];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("fun-taipei-pages-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())); });
async function rangedVideo(request) {
  const cache = await caches.open(CACHE); const fullRequest = new Request(VIDEO); let response = await cache.match(fullRequest);
  if (!response) { response = await fetch(fullRequest); if (response.ok) await cache.put(fullRequest, response.clone()); }
  const bytes = await response.arrayBuffer(); const match = /bytes=(\d+)-(\d*)/.exec(request.headers.get("range") || ""); const start = match ? Number(match[1]) : 0; const end = match && match[2] ? Number(match[2]) : bytes.byteLength - 1;
  return new Response(bytes.slice(start, end + 1), { status: 206, headers: { "Content-Type": "video/mp4", "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", event => {
  const request = event.request; if (request.method !== "GET") return; const url = new URL(request.url); if (url.origin !== self.location.origin) return;
  if (url.href === VIDEO && request.headers.has("range")) { event.respondWith(rangedVideo(request)); return; }
  if (request.mode === "navigate") { event.respondWith(fetch(request).then(response => { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(HOME, copy)); return response; }).catch(() => caches.match(HOME))); return; }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) caches.open(CACHE).then(cache => cache.put(request, response.clone())); return response; })));
});
