var cacheVersion = 2;
var cacheName = 'kc-media-lib' + cacheVersion;
var filesToCache = [
  '/assets/js/alpinejs-3.10.3.min.js',
  '/assets/css/fonts.css',
  '/assets/css/main.css',
  '/assets/css/normalize.css',
  '/assets/css/milligram.css',
  '/assets/images/android-chrome-192x192.png',
  '/assets/images/android-chrome-512x512.png',
  '/assets/images/apple-touch-icon.png',
  '/assets/images/favicon-16x16.png',
  '/assets/images/favicon-32x32.png',
  '/assets/images/favicon.ico',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300.woff',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300.eot',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300.svg',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300.ttf',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300.woff2',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300italic.eot',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300italic.svg',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300italic.ttf',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300italic.woff',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-300italic.woff2',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700.eot',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700.svg',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700.ttf',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700.woff',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700.woff2',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700italic.eot',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700italic.svg',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700italic.ttf',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700italic.woff',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-700italic.woff2',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-regular.eot',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-regular.svg',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-regular.ttf',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-regular.woff',
  '/assets/fonts/roboto-v30/roboto-v30-latin_cyrillic-ext_cyrillic-regular.woff2',  
];

/* Delete old app's caches */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (!filesToCache.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/* Serve cached content from cache and fetch other content */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.open(cacheName).then(function(cache) {
      console.log(e.request)
      return cache.match(e.request).then(function(response) {
        if (response) return response;
        return fetch(e.request.clone()).then(function(response) {
          return response;
        });
      }).catch(function(error) {
        console.error('  Error in fetch handler:', error);
        throw error;
      });
    })
  );
});

/* Start the service worker and cache all of the app's assets */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting();
});