// Service Worker - مطعم القيصر (مسارات نسبية للنشر على Firebase/GitHub Pages)
const CACHE_NAME = 'alqaysar-v2';

// Use relative paths (./) for compatibility with subdirectories
const STATIC_ASSETS = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './js/app.js',
  './js/admin.js',
  './manifest.json',
  './images/logo.png'
];

// Install - cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (e) => {
  const { request } = e;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external requests (Google Fonts, FontAwesome, etc.)
  if (!request.url.includes(self.location.origin)) return;

  e.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // Fallback for HTML pages
        if (request.destination === 'document') {
          return caches.match('./index.html');
        }
        return new Response('', { status: 503 });
      });
    })
  );
});
