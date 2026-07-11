self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Pass-through fetch for basic PWA requirements
  e.respondWith(fetch(e.request).catch(() => new Response("Network error")));
});
