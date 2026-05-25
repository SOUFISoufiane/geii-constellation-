const CACHE_NAME = 'geii-toolbox-v1';
const ASSETS = [
    './',
    './index.html',
    './shared/css/theme.css',
    './shared/css/toolbox.css',
    './shared/css/home.css',
    './shared/js/theme-switcher.js',
    './shared/js/home-galaxy.js',
    './shared/js/manifest.js',
    'https://cdn.plot.ly/plotly-2.27.0.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        }).catch(() => {
            // Fallback for offline if something isn't in cache
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
});
