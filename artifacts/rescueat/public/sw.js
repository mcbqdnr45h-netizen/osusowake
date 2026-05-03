// ⚠️ デプロイ時にこの数字を必ず上げること（v4 → v5 → v6 ...）
// バンプしないと iOS / PWA が古いキャッシュを掴み続けます
const CACHE_NAME = 'osusowake-v28';
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

  // ハッシュ付き JS / CSS / その他のスクリプト系は「絶対に HTML をフォールバックしない」
  //   理由: SPA fallback で /assets/xxx-abc123.js が無いと index.html が返り、
  //   ブラウザで `'text/html' is not a valid JavaScript MIME type` エラーになる。
  //   旧 SW がこのケースで `caches.match('/')` を返していた致命バグの根本対策。
  // 拡張子無し URL でも script/style destination を捕まえる (より頑健)
  const isScriptOrAsset =
    /\.(js|css|mjs|map|json)$/i.test(url.pathname) ||
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'worker';
  if (isScriptOrAsset) {
    event.respondWith(
      fetch(request).then((response) => {
        // text/html が返ってきた場合 (= SPA fallback) はキャッシュせず素通し
        // (ブラウザ側でエラーにしてもらい、 ユーザーがリロードで最新 HTML を取得できるように)
        const ct = response?.headers?.get?.('content-type') || '';
        if (response && response.status === 200 && response.type !== 'opaque' && !ct.includes('text/html')) {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
        }
        return response;
      }).catch(() => caches.match(request))  // ← オフライン時のみキャッシュへ。 index.html へは絶対フォールバックしない
    );
    return;
  }

  // ナビゲーション (HTML) のみ network-first + 失敗時 index.html フォールバック
  //   ★ 必ず request.mode === 'navigate' (or destination==='document') でゲート。
  //   それ以外の GET (画像以外の fetch API 呼び出し等) は network-first だが
  //   失敗時は index.html を返さず素通し (再度 MIME bug を防ぐ)。
  const isNavigation =
    request.mode === 'navigate' || request.destination === 'document';
  event.respondWith(
    fetch(request)
      .then((response) => {
        const ct = response?.headers?.get?.('content-type') || '';
        if (response && response.status === 200 && response.type !== 'opaque') {
          const toCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, toCache));
          // 念のため: ナビゲーション以外で text/html が来た場合の cache 上書きはしない
          if (!isNavigation && ct.includes('text/html')) {
            // 何もしない (caching は上の put で既に行われるため、 厳密にしたければここで cache.delete する)
          }
        }
        return response;
      })
      .catch(() => {
        if (isNavigation) {
          return caches.match(request).then((cached) => cached || caches.match('/'));
        }
        // 非ナビゲーション GET: cache にあれば返す、 無ければそのまま fail
        return caches.match(request);
      })
  );
});

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'おすそわけ', body: event.data.text() }; }

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
    self.registration.showNotification(payload.title || 'おすそわけ', options)
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
