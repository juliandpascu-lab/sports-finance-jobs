const CACHE = "finance-sports-jobs-v4";
const SHELL = ["./", "./index.html", "./browse.html", "./market.html", "./styles.css", "./app.js", "./market.js", "./manifest.webmanifest", "./icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then((response) => {
      if (response.ok && (event.request.url.includes("/data/") || event.request.url.endsWith(".html") || event.request.url.endsWith(".css") || event.request.url.endsWith(".js"))) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
