/* The app sends generic copy only. Sensitive health information is never rendered here. */
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};
  const title = typeof payload.title === 'string' ? payload.title : 'A private MAMA reminder';
  const body = typeof payload.body === 'string' ? payload.body : 'Open MAMA when you are ready.';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data: { url: '/' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
