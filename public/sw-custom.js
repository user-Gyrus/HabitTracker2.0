// Custom push notification handlers for service worker
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'Atomiq';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/pwa-192x192.png',
      badge: data.badge || '/badge-96x96.png',
      vibrate: [200, 100, 200],
      tag: 'atomiq-notification',
      requireInteraction: false,
      data: {
        url: data.url || '/',
      },
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
