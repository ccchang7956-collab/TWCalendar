/**
 * Service Worker for PWA
 */

const CACHE_NAME = 'tw-calendar-v2026-0223a'; // 更新版本號

const urlsToCache = [
    '/',
    '/index.html',
    '/css/index.css',
    '/js/config.js',
    '/js/utils.js',
    '/js/calendar.js',
    '/js/countdown.js',
    '/js/strategies.js',
    '/js/export.js',
    '/js/app.js',
    '/manifest.json'
];

// 安裝事件
self.addEventListener('install', event => {
    self.skipWaiting(); // 強制立即接管，避免卡在 waiting 狀態
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 啟用事件
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(cacheName => {
                    return cacheName !== CACHE_NAME;
                }).map(cacheName => {
                    return caches.delete(cacheName);
                })
            );
        })
    );
    self.clients.claim(); // 立即獲得頁面控制權
});

// 攔截請求
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // 1. 動態與資料檔採用 Network First 策略
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.json') || url.pathname.endsWith('.csv') || url.pathname.endsWith('.txt')) {
        event.respondWith(
            fetch(event.request).then(response => {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            }).catch(() => {
                // 若斷網，則 fallback 到快取
                return caches.match(event.request).then(response => {
                    return response || new Response('Offline', { status: 503 });
                });
            })
        );
    }
    // 2. 靜態資源使用 Cache First 策略
    else {
        event.respondWith(
            caches.match(event.request)
                .then(response => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then(response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    });
                })
        );
    }
});
