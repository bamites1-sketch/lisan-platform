// ─── LiSAN Progressive Web App Service Worker ───────────────────────────────
const CACHE_NAME = 'lisan-pwa-v2.2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-180x180.png',
  '/apple-touch-icon-precomposed.png',
  '/logo.png',
  '/manifest.json'
];

// Install: Cache critical app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets could not be pre-cached:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: Purge obsolete caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy based on request type
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip non-GET, API endpoints, upload endpoints, and authentication requests
  if (
    req.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/uploads/') ||
    url.protocol.startsWith('chrome-extension')
  ) {
    return;
  }

  // 1. Navigation requests (SPA pages): Network-first with /index.html fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return new Response(
            `<!DOCTYPE html>
            <html lang="en">
              <head><meta charset="utf-8"/><title>LiSAN Offline</title><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
              <body style="font-family:system-ui,sans-serif;background:#1a3a2a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;">
                <div>
                  <h1 style="color:#d4a017;font-size:2rem;margin-bottom:0.5rem;">ልሳን LiSAN</h1>
                  <h2 style="font-size:1.25rem;font-weight:600;margin-bottom:1rem;">You are currently offline</h2>
                  <p style="color:rgba(255,255,255,0.8);max-width:400px;line-height:1.5;margin-bottom:1.5rem;">
                    Your reading activities, stories, and recorded voice samples are stored safely on your device. Reconnect to the internet to sync with your teachers.
                  </p>
                  <button onclick="window.location.reload()" style="background:#d4a017;color:#1a3a2a;border:none;padding:10px 24px;border-radius:12px;font-weight:bold;cursor:pointer;">
                    Retry Connection
                  </button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Static Assets (CSS, JS, Fonts, Images): Stale-While-Revalidate
  if (
    url.pathname.startsWith('/assets/') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    req.destination === 'style' ||
    req.destination === 'script' ||
    req.destination === 'image' ||
    req.destination === 'font'
  ) {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        const fetchPromise = fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              const clone = networkRes.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
            }
            return networkRes;
          })
          .catch(() => cachedRes);

        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  // 3. All other requests: Network with cache fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});
