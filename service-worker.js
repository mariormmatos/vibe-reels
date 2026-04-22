const VERSION = 'v3';
const CACHE_STATIC = `vibe-reels-static-${VERSION}`;
const CACHE_FFMPEG = `vibe-reels-ffmpeg-${VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/app.js',
  './src/ui.js',
  './src/templates.js',
  './src/ffmpeg-commands.js',
  './src/ffmpeg-worker.js',
  './src/screens/home.js',
  './src/screens/picker.js',
  './src/screens/text.js',
  './src/screens/moments.js',
  './src/screens/export.js',
  './src/screens/share.js',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/luts/golden_hour.cube',
  './assets/luts/night_out.cube',
  './assets/luts/travel.cube'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      Promise.all(STATIC_ASSETS.map((u) => cache.add(u).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.open(CACHE_FFMPEG).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        if (fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      })
    );
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((c) => c || fetch(e.request))
    );
  }
});
