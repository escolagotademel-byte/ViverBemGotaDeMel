const CACHE_NAME = 'viver-bem-shell-v30';
const APP_SHELL = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './assets/logo-gota-de-mel.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  './js/come-come.js',
  './js/eventos-internos.js',
  './pages/come-come.html',
  './pages/eventos.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  // Keep data/API requests and external resources online-first.
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // App files: network first, with cached fallback for offline use.
  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('./index.html')))
  );
});
