/* Contrakr service worker.
 *
 * Deliberately conservative: the app is almost entirely live Supabase data,
 * so caching page HTML would show people stale feeds and stale messages.
 * We cache exactly one thing — an offline fallback page — and otherwise get
 * out of the way.
 *
 * Bump CACHE_VERSION whenever this file changes so old caches get purged.
 */

const CACHE_VERSION = "contrakr-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      // Activate immediately rather than waiting for every tab to close.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only page navigations. API calls, Supabase requests, and assets pass
  // straight through untouched.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_VERSION);
      const cached = await cache.match(OFFLINE_URL);
      return cached ?? Response.error();
    })
  );
});

/* ── Push notifications ───────────────────────────────────────────────
 * Inert until a user actually subscribes and the server starts sending.
 */

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Contrakr", body: event.data.text() };
  }

  const options = {
    body: payload.body,
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    vibrate: [100, 50, 100],
    tag: payload.tag,
    // Replace an existing notification of the same tag rather than stacking
    // five "new message" bubbles.
    renotify: !!payload.tag,
    data: { url: payload.url || "/feed" },
  };

  event.waitUntil(self.registration.showNotification(payload.title || "Contrakr", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/feed";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus an already-open Contrakr tab instead of opening a duplicate.
      for (const client of clientList) {
        if (client.url.includes(new URL(target, self.location.origin).pathname) && "focus" in client) {
          return client.focus();
        }
      }
      if (clientList.length > 0 && "navigate" in clientList[0]) {
        return clientList[0].focus().then((c) => c.navigate(target));
      }
      return self.clients.openWindow(target);
    })
  );
});
