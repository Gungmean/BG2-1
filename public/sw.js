// Bugwang High School 2-1 PWA Service Worker
const CACHE_NAME = 'bg2-1-pwa-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/symbol.png',
  '/icon-192.png',
  '/icon-512.png',
  '/badge-72.png',
  '/apple-touch-icon.png'
];

// Install: Cache static shell and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[SW] Precache fallback:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Cleanup old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Smart caching strategy (Network-First for HTML/APIs, Cache-First for static assets)
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Skip non-GET requests (e.g., Supabase mutations, POST)
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation request (HTML): Network-First, fallback to cached /index.html (SPA offline support)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html') || caches.match('/');
        })
    );
    return;
  }

  // 2. Local static assets (JS, CSS, fonts, images in /assets/ or /fonts/): Stale-While-Revalidate
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/fonts/') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.ttf') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js'))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return networkResponse;
          })
          .catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default: Network with cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Notification Click: 알림 클릭 시 앱 창 활성화 및 내일 리포트 열기
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/?openReport=tomorrow';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열려있는 창이 있으면 포커스 후 postMessage 전송
        for (const client of clientList) {
          if ('focus' in client) {
            client.postMessage({ action: 'OPEN_TOMORROW_REPORT' });
            return client.focus();
          }
        }
        // 열려있는 창이 없으면 타겟 URL로 새 창 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

