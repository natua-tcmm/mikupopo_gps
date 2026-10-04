// Bump this version whenever any app file or offline asset changes.
const CACHE = 'mikupopo-gps-v1';
const ASSETS = [
  './', './index.html', './style.css', './app.js', './geo.js', './location-worker.js',
  './manifest.webmanifest', './assets/fonts/MochiyPopOne-Regular.woff2',
  './assets/data/municipalities.json', './assets/data/municipalities.bin', './assets/icons/icon-192.png',
  './assets/icons/icon-512.png', './assets/icons/icon-maskable.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const prefix = 'mikupopo-gps-';
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // App requests never use third-party hosts.
  if (url.origin !== self.location.origin) {
    event.respondWith(Promise.resolve(Response.error()));
    return;
  }
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    if (event.request.mode === 'navigate') return cache.match('./index.html');
    return fetch(event.request);
  })());
});
