const CACHE_NAME = 'osusowake-v2';
const BASE = '/rescueat';

const PRECACHE_URLS = [
  `${BASE}/`,
  `${BASE}/manifest.json`,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.pathname.startsWith(`${BASE}/api/`)) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
        return response;
      }).catch(() => caches.match(`${BASE}/`));
    })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'Osusowake', body: event.data.text() }; }

  const options = {
    body: payload.body || 'お知らせがあります',
    icon: `${BASE}/images/logo.png`,
    badge: `${BASE}/images/logo.png`,
    tag: payload.tag || 'osusowake',
    data: { url: payload.url || `${BASE}/` },
    actions: [
      { action: 'open', title: 'アプリを開く' },
      { action: 'dismiss', title: '閉じる' },
    ],
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Osusowake', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || `${BASE}/`;
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      const existing = cls.find((c) => c.url.includes('/rescueat/'));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
