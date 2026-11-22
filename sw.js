// MyFits service worker: shows the 7:00 notification and opens Today when it's tapped.
// Paths are resolved against the worker's scope so it works at / (local) and /myfits/ (GitHub Pages).
const at = (path) => new URL(String(path).replace(/^\//, ''), self.registration.scope).href
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'MyFits'
  const options = {
    body: data.body || 'Your 3 outfits for today are ready 👗',
    icon: at('icon-192.png'),
    badge: at('badge-96.png'),
    tag: 'myfits-daily', // a newer notification replaces an older one
    data: { url: at(data.url || 'today') },
  }
  event.waitUntil(Promise.all([
    self.registration.showNotification(title, options),
    // Home-screen badge (iPhone 16.4+, Android, desktop) until she opens Today
    self.navigator && 'setAppBadge' in self.navigator ? self.navigator.setAppBadge(1).catch(() => {}) : Promise.resolve(),
  ]))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || at('today')
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of all) {
      if ('focus' in client) {
        await client.focus()
        if ('navigate' in client) await client.navigate(url).catch(() => {})
        return
      }
    }
    await self.clients.openWindow(url)
  })())
})
