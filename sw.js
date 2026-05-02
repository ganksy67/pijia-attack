const CACHE = 'pijia-attack-v3';
const ASSETS = [
  './?v=3',
  './index.html?v=3',
  './style.css?v=3',
  './app.js?v=3',
  './manifest.webmanifest?v=3',
  './assets/icon.svg?v=3'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html?v=3')));
    return;
  }
  event.respondWith(fetch(req).catch(() => caches.match(req)));
});
