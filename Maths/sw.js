// ═══════════════════════════════════════════════════════════════════
//  GEII TOOLBOX — SERVICE WORKER
//
//  Strategy:
//   • install  → precache the core shell (home + shared + CDN libs) so the
//                landing page always works offline.
//   • fetch    → "stale-while-revalidate": serve from cache instantly when
//                present, fetch from network in the background to refresh the
//                cache, and fall back to cache when the network is down. This
//                self-heals: any page/asset you've visited once is cached for
//                offline use, without needing an exhaustive precache list.
//   • activate → drop old cache versions.
//
//  Bump CACHE_NAME whenever the precache shell changes.
// ═══════════════════════════════════════════════════════════════════

const CACHE_NAME = 'geii-toolbox-v2';

// Core shell — the minimum needed to boot the landing page offline.
// App files are picked up lazily by the stale-while-revalidate handler.
const SHELL = [
    './',
    './index.html',
    './shared/css/theme.css',
    './shared/css/toolbox.css',
    './shared/css/home.css',
    './shared/js/theme-switcher.js',
    './shared/js/home-galaxy.js',
    './shared/js/manifest.js',
    './shared/js/app-header.js',
    'https://cdn.plot.ly/plotly-2.27.0.min.js',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css',
    'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
];

self.addEventListener('install', event => {
    self.skipWaiting(); // activate this version immediately
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache =>
            // Tolerate individual asset failures (e.g. a CDN hiccup) instead of
            // failing the whole install, which would leave no SW at all.
            Promise.allSettled(SHELL.map(url => cache.add(url)))
        )
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))
            ))
            .then(() => self.clients.claim()) // take control of open pages now
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;

    // Only handle GET; let the browser deal with POST/etc. directly.
    if (req.method !== 'GET') return;

    event.respondWith(
        caches.open(CACHE_NAME).then(async cache => {
            const cached = await cache.match(req);

            const network = fetch(req).then(resp => {
                // Only cache successful, basic/cors responses.
                if (resp && resp.status === 200 &&
                    (resp.type === 'basic' || resp.type === 'cors')) {
                    cache.put(req, resp.clone()).catch(() => {});
                }
                return resp;
            }).catch(() => null);

            // Stale-while-revalidate: cached first if we have it, else network.
            return cached || (await network) || cached ||
                new Response('Offline — resource not cached.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain' }
                });
        })
    );
});
