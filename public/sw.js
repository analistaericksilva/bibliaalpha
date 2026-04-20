/**
 * sw.js — Service Worker DESATIVADOR
 *
 * Este arquivo substitui o sw.js v6.
 * Ao ser instalado e ativado, ele:
 *   1. Apaga todos os caches (shell, bible, research, qualquer outro)
 *   2. Se auto-desregistra do navegador
 *   3. Recarrega todas as abas abertas para a versao fresca do servidor
 *
 * NAO intercepta nenhuma requisicao fetch — tudo vai direto para a rede.
 */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(cacheKeys.map(key => {
        console.log('[SW-KILL] Apagando cache:', key);
        return caches.delete(key);
      }));
      await self.registration.unregister();
      console.log('[SW-KILL] Service Worker desregistrado com sucesso.');
      const allClients = await self.clients.matchAll({ type: 'window' });
      allClients.forEach(client => {
        console.log('[SW-KILL] Recarregando aba:', client.url);
        client.navigate(client.url);
      });
    })()
  );
});
