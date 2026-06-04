/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const CACHE_NAME = 'mydocify-core-v2';
const DYNAMIC_CACHE_NAME = 'mydocify-runtime-v2';

// Essential assets to cache immediately during installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/robots.txt',
  '/sitemap.xml',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800;900&family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
];

// Service Worker Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[MyDocify Service Worker] Pre-caching core shell and secure libraries');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate Event - Clean up stale cache contexts
self.addEventListener('activate', (event) => {
  const allowedCaches = [CACHE_NAME, DYNAMIC_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!allowedCaches.includes(cacheName)) {
            console.log('[MyDocify Service Worker] Evicting deprecated storage cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Service Worker Fetch Interceptor
self.addEventListener('fetch', (event) => {
  // Only target GET requests (Ignore POST routes, Chrome Extension requests, firestore sync, etc.)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass intercepting any hot-reload WebSockets or browser extension assets
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.pathname.includes('/ws') || url.hostname.includes('chrome-extension')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached page immediately, then perform background fetch to refresh the cache (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(DYNAMIC_CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {
            // Silently absorb logging failures in offline state
          });
        return cachedResponse;
      }

      // If missing from cache, fetch from the web and record onto the Dynamic storage for future offline access
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Offline fallback mode for page navigation request
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
