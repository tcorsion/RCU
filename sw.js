/* Service worker — mode hors-ligne complet (app + documents PDF) */
const CACHE = 'cu-app-v6';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      const list = await (await fetch('cache-list.json', { cache: 'no-store' })).json();
      // précache fichier par fichier : un échec n'empêche pas les autres
      await Promise.all(list.map(async (url) => {
        try {
          const res = await fetch(url);
          if (res && res.ok) await cache.put(url, res);
          else console.warn('précache KO (HTTP)', res && res.status, url);
        } catch (e) {
          console.warn('précache KO', url, e);
        }
      }));
    } catch (e) {
      console.warn('cache-list.json illisible', e);
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith((async () => {
    // 1. cache d'abord (les PDF précachés s'ouvrent hors-ligne)
    const cached = await caches.match(req);
    if (cached) {
      // rafraîchit en arrière-plan pour la prochaine fois
      event.waitUntil((async () => {
        try {
          const fresh = await fetch(req);
          if (fresh && fresh.ok) (await caches.open(CACHE)).put(req, fresh);
        } catch (_) { /* hors-ligne : on garde le cache */ }
      })());
      return cached;
    }
    // 2. réseau, puis mise en cache
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (e) {
      // 3. hors-ligne
      if (req.mode === 'navigate') {
        const path = new URL(req.url).pathname;
        const isFile = /\.[a-z0-9]+$/i.test(path); // .pdf, .html, .js…
        if (!isFile) {
          // route SPA (index.html#/…) → on renvoie l'appli
          const shell = await caches.match('index.html');
          if (shell) return shell;
        }
        return new Response('Fichier non disponible hors-ligne (pas encore ouvert en ligne).', {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
      throw e;
    }
  })());
});
