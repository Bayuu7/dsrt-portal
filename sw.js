const DSRT_CACHE = 'dsrt-app-v2';
const PRECACHE = ['/', '/index.html', '/assets/styles.css'];

self.addEventListener('install', evt => {
  evt.waitUntil(caches.open(DSRT_CACHE).then(cache => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', evt => { evt.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', evt => {
  evt.respondWith(caches.match(evt.request).then(r => r || fetch(evt.request)));
});
