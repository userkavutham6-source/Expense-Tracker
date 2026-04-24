const CACHE_NAME = 'smarttrack-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/index.css',
  './css/components.css',
  './css/responsive.css',
  './js/app.js',
  './js/modules/utils.js',
  './js/modules/validator.js',
  './js/modules/db.js',
  './js/modules/store.js',
  './js/modules/router.js',
  './js/modules/theme.js',
  './js/modules/profiles.js',
  './js/modules/recurring.js',
  './js/modules/predictions.js',
  './js/modules/export.js',
  './js/modules/charts.js',
  './js/components/dashboard.js',
  './js/components/expenses.js',
  './js/components/budgets.js',
  './js/components/analytics.js',
  './js/components/settings.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip cross-origin requests unless they are in our allowed list (like fonts/charts)
  const isLocal = event.request.url.startsWith(self.location.origin);
  const isFont = event.request.url.includes('fonts.googleapis.com') || event.request.url.includes('fonts.gstatic.com');
  const isChartJs = event.request.url.includes('cdn.jsdelivr.net');
  
  if (!isLocal && !isFont && !isChartJs) return;

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached response if found
        if (cachedResponse) {
          // Fetch from network in background to update cache for next time
          event.waitUntil(
            fetch(event.request).then((networkResponse) => {
              caches.open(CACHE_NAME).then((cache) => {
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(event.request, networkResponse.clone());
                }
              });
            }).catch(() => {})
          );
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then((networkResponse) => {
          // Don't cache if not a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && !isFont && !isChartJs) {
            return networkResponse;
          }

          // Clone response and add to cache
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });
      })
  );
});
