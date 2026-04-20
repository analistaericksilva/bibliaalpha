/**
 * sw.js — Service Worker Biblia Alpha
 * Versao: 2026-04-20-v3
 * Estrategia: networkFirst para HTML, cacheFirst para assets com hash
 */

const CACHE_VERSION = 'bibliaalpha-v3';
const ASSETS_CACHE  = 'bibliaalpha-assets-v3';

const PRECACHE = ['/manifest.json', '/icon.svg'];

// ── Instala e ativa imediatamente ─────────────────────────────────────────────
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(PRECACHE).catch(() => {}))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      // Apaga TODOS os caches antigos de versoes anteriores
      const keys = await caches.keys();
      await Promise.all(
        keys.filter(k => k !== CACHE_VERSION && k !== ASSETS_CACHE)
            .map(k => { console.log('[SW] Removendo cache antigo:', k); return caches.delete(k); })
      );
      await self.clients.claim();
      console.log('[SW] Ativo. Cache:', CACHE_VERSION);
    })()
  );
});

// ── Estrategia de fetch ────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar nao-GET e extensoes do Chrome
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Nao interceptar chamadas Firebase/Google API
  if (url.hostname.includes('firestore.googleapis.com')) return;
  if (url.hostname.includes('identitytoolkit.googleapis.com')) return;
  if (url.hostname.includes('securetoken.googleapis.com')) return;
  if (url.hostname.includes('googleapis.com')) return;

  // Assets com hash (Vite): cache primeiro, rede como fallback
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then(async cache => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const fresh = await fetch(request);
        if (fresh.ok) cache.put(request, fresh.clone());
        return fresh;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // HTML e navegacao: SEMPRE rede primeiro com no-store, cache como fallback offline
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match('/') || caches.match(request))
    );
    return;
  }
});

// Ouve SKIP_WAITING para atualizacoes forcadas via postMessage
self.addEventListener('message', event => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
