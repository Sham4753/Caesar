// Service Worker - مطعم القيصر
const CACHE_NAME = 'alqaysar-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/css/style.css',
  '/js/app.js',
  '/js/admin.js',
  '/manifest.json',
  '/images/logo.png'
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

  // For API/data requests (localStorage doesn't go through SW)
  if (request.url.includes('localStorage') || request.method !== 'GET') {
    return;
  }

  e.respondWith(
    fetch(request).then((response) => {
      // Cache successful responses
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      // Fallback to cache when offline
      return caches.match(request).then((cached) => {
        if (cached) return cached;
        // Fallback for HTML pages
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
        return new Response('⚠️ أنت غير متصل بالإنترنت. القائمة محفوظة محلياً.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});

// Background sync for orders (when connection returns)
self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-orders') {
    e.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  // Orders are handled via WhatsApp, but we could sync analytics here
  console.log('[SW] Background sync triggered');
}
