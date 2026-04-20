import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './components/AuthProvider.tsx';
import LoginGuard from './components/LoginGuard.tsx';

// ─── Service Worker Registration + Force Update ───────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none', // nunca usa cache do browser para sw.js
      });

      // Força verificação de atualização a cada carregamento
      registration.update();

      // Quando novo SW está esperando → ativa imediatamente
      const activateNew = (reg: ServiceWorkerRegistration) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      };

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            activateNew(registration);
          }
        });
      });

      // Recarrega a página quando um novo SW assume o controle
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      console.log('[SW] Registrado:', registration.scope);
    } catch (err) {
      console.warn('[SW] Falha ao registrar:', err);
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

window.addEventListener('error', (e: ErrorEvent) => {
  const msg = e.message || '';
  if (msg.includes('Loading chunk') || msg.includes('Failed to fetch dynamically imported module') || msg.includes('Importing a module script failed')) {
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
