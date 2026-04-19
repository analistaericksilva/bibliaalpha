// sw.js — Service Worker Corretivo
// Desregistra qualquer SW antigo e limpa todos os caches do navegador.

self.addEventListener('install', () => {
  self.skipWaiting();
  });

  self.addEventListener('activate', async () => {
    const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
        await self.registration.unregister();
          const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
            clients.forEach(client => client.navigate(client.url));
            });
