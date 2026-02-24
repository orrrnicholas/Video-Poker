/**
 * Service Worker
 * Enables offline functionality and caches application assets
 */

const CACHE_NAME = 'card-ev-analyzer-v2';
const ASSETS_TO_CACHE = [
    '/Video-Poker/',
    '/Video-Poker/index.html',
    '/Video-Poker/style.css',
    '/Video-Poker/main.js',
    '/Video-Poker/manifest.json',
    '/Video-Poker/engine/evaluator.js',
    '/Video-Poker/engine/combinatorics.js',
    '/Video-Poker/engine/evCalculator.js',
    '/Video-Poker/engine/multiHandAnalysis.js',
    '/Video-Poker/ui/gameSelector.js',
    '/Video-Poker/ui/cardInput.js',
    '/Video-Poker/ui/paytableEditor.js',
    '/Video-Poker/ui/resultsView.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching assets...');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('Service Worker installed successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Cache installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - network-first strategy (like a website)
// Always try to fetch from network first, fall back to cache if offline
self.addEventListener('fetch', (event) => {
    // Only cache GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        // Try network first
        fetch(event.request)
            .then((response) => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }

                // Clone the response
                const responseToCache = response.clone();

                // Cache the successful response for offline use
                caches.open(CACHE_NAME)
                    .then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }

                        // No cache available either
                        return new Response(
                            'Network error - application is available offline',
                            {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'text/plain'
                                })
                            }
                        );
                    });
            })
    );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
