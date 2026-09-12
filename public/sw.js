// LIMS-PRO Service Worker v5.0 Offline-First
const CACHE_VERSION = 'lims-pro-v5';
const STATIC_CACHE  = CACHE_VERSION + '-static';
const DYNAMIC_CACHE = CACHE_VERSION + '-dynamic';
const OFFLINE_FALLBACK = '/index.html';
const PRECACHE_ASSETS = ['/', '/index.html', '/manifest.json', '/favicon.svg'];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(function(c) { return c.addAll(PRECACHE_ASSETS).catch(function(e) { console.warn('[SW]', e); }); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== STATIC_CACHE && k !== DYNAMIC_CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  var url = new URL(request.url);
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(function() {
        return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(function(res) {
        caches.open(DYNAMIC_CACHE).then(function(c) { c.put(request, res.clone()); });
        return res;
      }).catch(function() {
        return caches.match(OFFLINE_FALLBACK) || caches.match('/');
      })
    );
    return;
  }

  if (/\.(js|css|woff2?|ttf|svg|png|jpg|webp|ico)$/.test(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(function(cached) {
        if (cached) return cached;
        return fetch(request).then(function(res) {
          if (res && res.status === 200 && res.type !== 'opaque') {
            caches.open(STATIC_CACHE).then(function(c) { c.put(request, res.clone()); });
          }
          return res;
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.open(DYNAMIC_CACHE).then(function(cache) {
      return cache.match(request).then(function(cached) {
        var net = fetch(request).then(function(res) {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        }).catch(function() { return cached; });
        return cached || net;
      });
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'lims-sync-queue') {
    event.waitUntil(
      self.clients.matchAll().then(function(cs) {
        cs.forEach(function(c) { c.postMessage({ type: 'SYNC_COMPLETED', ts: Date.now() }); });
      })
    );
  }
});

self.addEventListener('push', function(event) {
  var d = (event.data && event.data.json()) || {};
  event.waitUntil(self.registration.showNotification(d.title || 'LIMS-PRO', {
    body: d.body || 'Nueva notificacion del laboratorio',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'lims',
    data: { url: d.url || '/' }
  }));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow((event.notification.data && event.notification.data.url) || '/'));
});

self.addEventListener('message', function(event) {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'GET_VERSION' && event.source) event.source.postMessage({ type: 'VERSION', version: CACHE_VERSION });
  if (event.data.type === 'CLEAR_CACHE') caches.keys().then(function(keys) { return Promise.all(keys.map(function(k) { return caches.delete(k); })); });
});
