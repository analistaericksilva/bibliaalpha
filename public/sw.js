/**
 * sw.js — Biblia Alpha Service Worker v5
 *
 * v5: remove force-navigate no activate (evita loop infinito de reload)
 *     network-first para HTML (garante index.html sempre atualizado)
 *     cache-first para /assets/* (hashes imutaveis)
 */

const CACHE_VERSION = 'v5';
const SHELL_CACHE    = 'bibliaalpha-shell-'    + CACHE_VERSION;
const BIBLE_CACHE    = 'bibliaalpha-bible-'    + CACHE_VERSION;
const RESEARCH_CACHE = 'bibliaalpha-research-' + CACHE_VERSION;

const BIBLE_API_HOSTS = [
  'bible.helloao.org',
  'bible-api.com',
];

const RESEARCH_API_HOSTS = [
  'pt.wikipedia.org',
  'en.wikipedia.org',
  'www.googleapis.com',
  'kgsearch.googleapis.com',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(
      names
        .filter(n => n.startsWith('bibliaalpha-') && ![SHELL_CACHE, BIBLE_CACHE, RESEARCH_CACHE].includes(n))
        .map(n => caches.delete(n))
    );
    await self.clients.claim();
    // REMOVIDO: clients.forEach(c => c.navigate(c.url)) causava loop de reload
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (BIBLE_API_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(BIBLE_CACHE, event.request));
    return;
  }

  if (RESEARCH_API_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(RESEARCH_CACHE, event.request));
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(SHELL_CACHE, event.request));
    return;
  }

  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(SHELL_CACHE, event.request));
    return;
  }

  event.respondWith(networkFirst(SHELL_CACHE, event.request));
});

async function networkFirst(cacheName, request) {
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function cacheFirst(cacheName, request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok || response.type === 'opaque') {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

async function staleWhileRevalidate(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok || response.type === 'opaque') {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || fetchPromise;
}
