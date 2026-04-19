import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './components/AuthProvider.tsx';
import LoginGuard from './components/LoginGuard.tsx';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <LoginGuard>
      <App />
    </LoginGuard>
  </AuthProvider>,
);
