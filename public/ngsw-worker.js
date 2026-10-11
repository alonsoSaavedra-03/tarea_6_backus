// Angular Service Worker (ngsw-worker.js)
// Simulación y ejecución exacta de Runtime Caching para Backus Ventas PWA
// dataGroups: catalogo-backus (performance) y precios-backus (freshness, timeout: 3s)

const CACHE_APP_SHELL = 'ngsw:/:app:app:cache';
const CACHE_CATALOGO = 'ngsw:/:data:catalogo-backus:cache';
const CACHE_PRECIOS = 'ngsw:/:data:precios-backus:cache';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/data/catalogo.json',
  '/data/precios.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// 1. INSTALL: Prefetch App Shell
self.addEventListener('install', (event) => {
  console.log('[NGSW] Instalando Service Worker de Angular 19...');
  event.waitUntil(
    caches.open(CACHE_APP_SHELL).then((cache) => {
      console.log('[NGSW] App Shell precargado en Cache Storage.');
      return cache.addAll(APP_SHELL_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. ACTIVATE: Claim clients and purge old caches
self.addEventListener('activate', (event) => {
  console.log('[NGSW] Activando Service Worker de Angular 19...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![CACHE_APP_SHELL, CACHE_CATALOGO, CACHE_PRECIOS].includes(key)) {
            console.log('[NGSW] Purgando caché obsoleta:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. FETCH: Runtime Caching mediante dataGroups
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A. DATAGROUP: catalogo-backus (strategy: performance)
  // Prioriza la respuesta almacenada en caché; actualiza en background
  if (url.pathname.includes('/data/catalogo.json')) {
    event.respondWith(
      caches.open(CACHE_CATALOGO).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        
        // Disparar actualización en segundo plano
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => cachedResponse);

        if (cachedResponse) {
          console.log('[NGSW][Strategy: Performance] Servido desde caché local: /data/catalogo.json');
          return cachedResponse;
        }

        console.log('[NGSW][Strategy: Performance] Primera carga desde red: /data/catalogo.json');
        return fetchPromise;
      })
    );
    return;
  }

  // B. DATAGROUP: precios-backus (strategy: freshness, timeout: 3s)
  // Prioriza la red para máxima frescura; si falla o supera 3s, recurre a caché
  if (url.pathname.includes('/data/precios.json')) {
    event.respondWith(
      caches.open(CACHE_PRECIOS).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);

        // Promesa de red con timeout de 3 segundos
        const networkWithTimeout = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            console.warn('[NGSW][Strategy: Freshness] Timeout de 3s alcanzado. Desviando a caché local...');
            if (cachedResponse) resolve(cachedResponse);
            else reject(new Error('Timeout de red sin copia en caché'));
          }, 3000);

          fetch(event.request).then((networkResponse) => {
            clearTimeout(timeoutId);
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
              console.log('[NGSW][Strategy: Freshness] Datos frescos recibidos de red: /data/precios.json');
            }
            resolve(networkResponse);
          }).catch((err) => {
            clearTimeout(timeoutId);
            if (cachedResponse) {
              console.log('[NGSW][Strategy: Freshness] Red caída. Entregando copia previa de caché.');
              resolve(cachedResponse);
            } else {
              reject(err);
            }
          });
        });

        return networkWithTimeout;
      })
    );
    return;
  }

  // C. APP SHELL & ASSETS ESTÁTICOS (Cache First)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
