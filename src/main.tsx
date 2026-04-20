import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './components/AuthProvider.tsx';
import LoginGuard from './components/LoginGuard.tsx';

// ── Service Worker Registration ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
      });

      // Verifica atualização a cada carregamento
      reg.update();

      // Novo SW esperando → ativa imediatamente
      const activateWaiting = (r: ServiceWorkerRegistration) => {
        if (r.waiting) r.waiting.postMessage({ type: 'SKIP_WAITING' });
      };

      // SW novo encontrado durante a sessão
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed' && navigator.serviceWorker.controller) {
            activateWaiting(reg);
          }
        });
      });

      // Se já há um SW esperando ao carregar
      if (reg.waiting) activateWaiting(reg);

      console.log('[SW] Registrado:', reg.scope);
    } catch (err) {
      console.warn('[SW] Falha ao registrar:', err);
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// Chunk load error → reload único
window.addEventListener('error', (e: ErrorEvent) => {
  const msg = e.message || '';
  if (
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed')
  ) {
    if (!sessionStorage.getItem('__chunk_reload')) {
      sessionStorage.setItem('__chunk_reload', '1');
      location.reload();
    }
  }
});
window.addEventListener('load', () => sessionStorage.removeItem('__chunk_reload'));

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <LoginGuard>
      <App />
    </LoginGuard>
  </AuthProvider>,
);
