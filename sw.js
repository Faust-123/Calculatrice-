const CACHE_NAME = 'calc-cache-v3';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// Installation du Service Worker
self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(FILES_TO_CACHE);
      })
      .catch(err => console.log('Erreur cache install:', err))
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      })
    ))
  );
  self.clients.claim();
});

// Stratégie: Cache d'abord, puis réseau
self.addEventListener('fetch', (evt) => {
  // Ignorer les requêtes non-GET
  if (evt.request.method !== 'GET') {
    return;
  }

  evt.respondWith(
    caches.match(evt.request)
      .then((response) => {
        // Retourner depuis le cache si disponible
        if (response) {
          return response;
        }

        // Sinon, récupérer depuis le réseau
        return fetch(evt.request)
          .then((response) => {
            // Ne pas cacher les réponses non-valides
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Cloner la réponse pour la mettre en cache
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(evt.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Mode hors ligne - retourner depuis le cache
            return caches.match(evt.request);
          });
      })
  );
});
