const CACHE_VERSION = 'aprendejs-v3';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const CONTENT_CACHE = `content-${CACHE_VERSION}`;

// Recursos del app shell que se precargan al instalar.
// OJO: '/' NO va acá — siempre redirige (307) a /courses, y la Cache API
// rechaza cachear una respuesta redirigida. cache.addAll() es todo-o-nada:
// esa sola entrada tira abajo el install completo y el SW nunca llega a
// activarse (queda pegado en la versión vieja para siempre).
const APP_SHELL = [
  '/courses',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ─── Instalación ─────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Precacheo resiliente: si UNA url falla (404, redirect, red caída),
      // no debe tumbar el install entero como hacía cache.addAll().
      Promise.allSettled(
        APP_SHELL.map((url) =>
          fetch(url)
            .then((response) => {
              if (response.ok && !response.redirected) {
                return cache.put(url, response);
              }
              console.warn(`[SW] Precache omitido para ${url}: status=${response.status} redirected=${response.redirected}`);
            })
            .catch((err) => console.warn(`[SW] Precache falló para ${url}:`, err))
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Activación ──────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, API_CACHE, CONTENT_CACHE].includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Estrategias de cache ─────────────────────────────────────────────────────

/**
 * Cache First: para assets estáticos de Next.js (JS, CSS con hash en el nombre).
 * Son inmutables por diseño — el hash cambia cuando el contenido cambia.
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

/**
 * Network First: para llamadas a la API.
 * Intenta la red; si falla (sin internet), sirve desde cache.
 * Crítico para que los estudiantes puedan ver lecciones offline.
 */
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: 'Sin conexión', offline: true }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Stale While Revalidate: para páginas HTML.
 * Sirve desde cache de inmediato (rápido) y actualiza en segundo plano.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => undefined);

  const response = cached || (await fetchPromise);
  if (response) return response;

  // Sin cache y sin red: nunca resolver a undefined (event.respondWith(undefined)
  // hace que el navegador reporte network error / ERR_FAILED en vez de mostrar algo).
  const offline = await cache.match('/offline');
  return offline || Response.error();
}

// ─── Intercepción de peticiones ───────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no-GET y cross-origin (excepto fuentes de Google)
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) return;

  // Assets estáticos de Next.js (_next/static): Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Imágenes y assets estáticos del public/: Cache First
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/)
  ) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // API de lecciones y cursos: Network First (offline crítico)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Páginas HTML: Stale While Revalidate
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // Resto: Network First con fallback a cache
  event.respondWith(networkFirst(request, CONTENT_CACHE));
});

// ─── Mensajes desde el cliente ────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  // Permitir que el cliente fuerce la actualización del SW
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  // Limpiar cache de API (útil al recuperar conexión)
  if (event.data?.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE).then(() => {
      event.source?.postMessage({ type: 'API_CACHE_CLEARED' });
    });
  }
});

// ─── Utilidad VAPID ──────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

// ─── Push notifications ──────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  try {
    const data = event.data?.json() ?? {}
    const options = {
      body: data.body ?? '',
      icon: data.icon ?? '/icons/icon-192.png',
      badge: data.badge ?? '/icons/badge-72x72.png',
      tag: data.tag,
      data: data.data ?? {},
    }
    event.waitUntil(
      self.registration.showNotification(data.title ?? 'AprendeJS', options)
    )
  } catch (e) {
    console.error('[SW] push parse error', e)
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(url) && 'focus' in c)
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    fetch('/api/push/vapid-public-key')
      .then((r) => r.json())
      .then(({ publicKey }) =>
        self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      )
      .then((subscription) =>
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
          credentials: 'include',
        })
      )
  )
})
