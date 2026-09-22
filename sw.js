// Service Worker для WU Coach PWA - Offline-First кэширование
// Версия: 1.0.0

const CACHE_NAME = 'wu-coach-v5-record-labels';
const CACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './icons/icon-16x16.png',
    './icons/icon-32x32.png',
    './icons/icon-57x57.png',
    './icons/icon-60x60.png',
    './icons/icon-72x72.png',
    './icons/icon-76x76.png',
    './icons/icon-96x96.png',
    './icons/icon-114x114.png',
    './icons/icon-120x120.png',
    './icons/icon-128x128.png',
    './icons/icon-144x144.png',
    './icons/icon-152x152.png',
    './icons/icon-180x180.png',
    './icons/icon-192x192.png',
    './icons/icon-384x384.png',
    './icons/icon-512x512.png'
];

// Установка Service Worker - кэшируем все статические ресурсы
self.addEventListener('install', (event) => {
    console.log('✅ Service Worker: Установка...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Service Worker: Кэширование файлов приложения');
                return cache.addAll(CACHE_URLS);
            })
            .then(() => {
                console.log('✅ Service Worker: Установлен и готов к работе');
                return self.skipWaiting(); // Активируем сразу
            })
            .catch((error) => {
                console.error('❌ Service Worker: Ошибка кэширования:', error);
            })
    );
});

// Активация Service Worker - удаляем старые кэши
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Активация...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Service Worker: Удаление старого кэша:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker: Активирован');
                return self.clients.claim(); // Перехватываем управление сразу
            })
    );
});

// Перехват fetch запросов - стратегия кэширования
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Данные API хранятся в localStorage приложения. Устаревший HTTP-кэш
    // не должен подменять ошибку сети успешной загрузкой старых замеров.
    if (request.method !== 'GET' || url.hostname.endsWith('.supabase.co')) return;

    // Только SDK: сеть с fallback на кэш, без ответов рабочей базы.
    if (url.hostname === 'cdn.jsdelivr.net') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Кэшируем успешный ответ
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Если сеть недоступна, берем из кэша
                    return caches.match(request)
                        .then((cachedResponse) => {
                            if (cachedResponse) {
                                console.log('📴 Service Worker: Загружено из кэша (offline):', request.url);
                                return cachedResponse;
                            }
                            // Если в кэше нет - возвращаем ошибку
                            return new Response('Offline: ресурс недоступен', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                })
        );
        return;
    }

    // Статические файлы PWA - Cache First (быстрая загрузка)
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Если нет в кэше - загружаем с сети
                return fetch(request)
                    .then((response) => {
                        // Кэшируем только успешные GET запросы
                        if (request.method === 'GET' && response.status === 200) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(request, responseClone);
                            });
                        }
                        return response;
                    })
                    .catch((error) => {
                        console.warn('⚠️ Service Worker: Ошибка загрузки:', request.url, error);

                        // Для HTML возвращаем index.html из кэша (offline fallback)
                        if (request.destination === 'document') {
                            return caches.match('./index.html');
                        }

                        throw error;
                    });
            })
    );
});
