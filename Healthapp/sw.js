// Service Worker for offline support
const CACHE_NAME = 'sehatpal-v1';

// Files to cache
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './js/app.js',
    './js/auth.js',
    './js/db.js',
    './js/emergency.js',
    './js/opd.js',
    // External libs (might need better caching strat later)
    'https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;700&display=swap',
    'https://unpkg.com/html5-qrcode',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Install event
self.addEventListener('install', (e) => {
    console.log("Installing SW...");
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Fetch event
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => {
            return response || fetch(e.request);
        })
    );
});
