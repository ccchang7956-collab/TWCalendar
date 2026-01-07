/**
 * Service Worker for PWA
 */

const CACHE_NAME = 'tw-calendar-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/index.css',
    '/js/utils.js',
    '/js/calendar.js',
    '/js/countdown.js',
    '/js/strategies.js',
    '/js/export.js',
    '/js/app.js',
    '/data/holidays.json',
    '/manifest.json'
];

// 安裝事件
self.addEventListener('install', event => {
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
});

// 攔截請求
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 快取命中，返回快取
                if (response) {
                    return response;
                }

                // 快取未命中，發送網路請求
                return fetch(event.request).then(response => {
                    // 檢查是否為有效回應
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // 複製回應（因為回應只能使用一次）
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
    );
});
