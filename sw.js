const CACHE_NAME = 'chess-pro-v1';
const ASSETS = [
    '/',
    '/index.html',
    'https://cdn.socket.io/4.7.2/socket.io.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.0/stockfish.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
