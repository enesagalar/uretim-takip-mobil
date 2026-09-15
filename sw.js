/* Ekol Glass Üretim Takip — Service Worker */
const VERSION = 'utm-v1.3.0';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css?v=1.3.0',
  './js/app.js?v=1.3.0',
  './js/demo-data.js?v=1.3.0',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './assets/logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // API, tünel bilgisi ve cross-origin istekleri dokunma; WebSocket SW'den geçmez
  if (url.pathname.includes('/api/') || url.pathname.endsWith('/tunnel.json') || url.origin !== location.origin) return;

  if (e.request.mode === 'navigate') {
    // Sayfa: ağ önce, yoksa önbellek
    e.respondWith(
      fetch(e.request)
        .then((res) => { caches.open(VERSION).then((c) => c.put('./index.html', res.clone())); return res; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Kod dosyaları: ağ önce (güncel kalsın), düşerse önbellek; görseller: önbellek önce
  const isAsset = /\.(png|svg|ico)$/.test(url.pathname);
  if (isAsset) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      }))
    );
  } else {
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => caches.match(e.request))
    );
  }
});
