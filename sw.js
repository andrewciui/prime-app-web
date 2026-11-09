/* Prime Painting service worker: shows paint and order alerts on the lock screen and in the notification list.
   No caching on purpose: the app always loads fresh from the website. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "Prime Painting", body: e.data ? e.data.text() : "" }; }
  const actions = d.maps ? [{ action: "go", title: "📍 Take me there" }, { action: "view", title: "View order" }] : [];
  const show = self.registration.showNotification(d.title || "Prime Painting", {
    body: d.body || "", tag: d.tag || "prime", renotify: true, timestamp: d.ts || Date.now(),
    icon: "icons/icon-192.png", badge: "icons/badge-96.png", requireInteraction: !!d.sticky,
    data: { url: d.url || "./", maps: d.maps || "" }, actions,
  });
  const badge = typeof d.badge === "number" && self.navigator && self.navigator.setAppBadge ? self.navigator.setAppBadge(d.badge).catch(() => {}) : null;
  e.waitUntil(Promise.all([show, badge]));
});

self.addEventListener("notificationclick", (e) => {
  const n = e.notification; const data = n.data || {}; n.close();
  if (e.action === "go" && data.maps) { e.waitUntil(self.clients.openWindow(data.maps)); return; }
  const target = new URL(data.url || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if (c.url.indexOf(self.registration.scope) === 0 && "focus" in c) { c.postMessage({ prime: "open", url: data.url || "" }); return c.focus(); }
    }
    return self.clients.openWindow(target);
  }));
});
