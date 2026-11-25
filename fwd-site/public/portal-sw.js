// Service worker for the client area (/portal). It does two things: lets the
// client area be installed as an app, and shows the notifications Sam is sent
// (server/portal/push.ts). It stores nothing, so pages are always live.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const openPages = () => self.clients.matchAll({ type: 'window', includeUncontrolled: true });

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // an empty or unreadable message still has to show something
  }
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title || 'FWD client area', {
        body: data.body || '',
        icon: '/portal-icon-192.png',
        badge: '/portal-icon-192.png',
        data: { url: data.url || '/portal' },
      });
      // The number on the app icon: how many notifications are waiting.
      if (typeof data.count === 'number' && self.navigator.setAppBadge) {
        await self.navigator.setAppBadge(data.count).catch(() => {});
      }
      // If the client area is open, tell it to refresh its list.
      for (const page of await openPages()) page.postMessage({ type: 'portal:push' });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/portal';
  event.waitUntil(
    (async () => {
      const page = (await openPages()).find((p) => new URL(p.url).pathname.replace(/\/$/, '') === '/portal');
      if (page) {
        page.postMessage({ type: 'portal:open', url });
        return page.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
