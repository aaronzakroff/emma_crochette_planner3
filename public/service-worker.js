const CACHE_NAME = 'crochet-calendar-v1';
const urlsToCache = [
    '/',
    '/css/styles.css',
    '/css/calendar.css',
    '/js/app.js',
    '/js/api.js',
    '/js/calendar.js',
    '/js/client.js',
    '/js/notifications.js'
];

// Install service worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'Notification', body: event.data.text() };
        }
    }
    
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        tag: data.tag || 'lesson-notification',
        requireInteraction: false,
        silent: false,
        renotify: false
    };
    
    // iOS doesn't fully support notification actions, so we'll keep them simple
    // but they may not display on iOS
    options.actions = [
        {
            action: 'view',
            title: 'View'
        },
        {
            action: 'close',
            title: 'Close'
        }
    ];
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Crochet Lesson', options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    // Handle iOS and other platforms
    const action = event.action;
    const urlToOpen = '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // If a window is already open, focus it
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});



