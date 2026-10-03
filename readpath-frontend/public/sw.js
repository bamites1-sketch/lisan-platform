// ─── Lisan Service Worker (Offline Resilience & Caching) ─────────────────────
const CACHE_NAME = 'lisan-pwa-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/founder.png',
]

// Install event: cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Continue if some static assets aren't yet generated
      })
    })
  )
  self.skipWaiting()
})

// Activate event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    })
  )
  self.clients.claim()
})

// Fetch event: Network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Skip API mutations and cross-origin tracking
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/recordings/upload') ||
    url.pathname.startsWith('/api/auth')
  ) {
    return
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }
        return networkResponse
      })
      .catch(async () => {
        // If network is offline, check cache
        const cachedResponse = await caches.match(event.request)
        if (cachedResponse) {
          return cachedResponse
        }
        // Fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html')
        }
        return new Response('Network offline', { status: 503, statusText: 'Offline' })
      })
  )
})
