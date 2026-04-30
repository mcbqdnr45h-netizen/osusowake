// ⚠️ デプロイ時にこの数字を必ず上げること（v4 → v5 → v6 ...）
// バンプしないと iOS / PWA が古いキャッシュを掴み続けます
const CACHE_NAME = 'osusowake-v11';
const BASE = '';

const PRECACHE_URLS = [
  '/',
  '/manifest.json',
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

// 画像・フォントなど不変アセットの判定
function isStaticAsset(url) {
  return /\.(png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) return;
  // Vite ビルドのハッシュ付き JS/CSS や Supabase / Stripe などはキャッシュ対象外
  if (url.origin !== self.location.origin) return;

  // 画像・フォントは cache-first（変わらないので速度優先）
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200 && response.type !== 'opaque') {
            const toCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML / JS / CSS など更新が反映されるべきファイルは network-first
  // 失敗時のみキャッシュにフォールバック（オフライン対応）
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/'))
      )
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'Osusowake', body: event.data.text() }; }

  const options = {
    body: payload.body || 'お知らせがあります',
    icon: '/images/logo.png',
    badge: '/images/logo.png',
    tag: payload.tag || 'osusowake',
    data: { url: payload.url || '/' },
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
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cls) => {
      const existing = cls.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
