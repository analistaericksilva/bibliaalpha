import { initializeApp } from 'firebase/app';
    import {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      signInWithRedirect,
      getRedirectResult,
      signOut,
    } from 'firebase/auth';
    import { getFirestore } from 'firebase/firestore';
    import firebaseConfig from '../../firebase-applet-config.json';

    const app = initializeApp(firebaseConfig);

    export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");
    export const auth = getAuth(app);
    export const googleProvider = new GoogleAuthProvider();

    export interface UserProfile {
      email: string;
      nome: string;
      foto: string;
      status: 'pending' | 'approved' | 'blocked';
      isAdmin?: boolean;
    }

    const isMobile = () =>
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod|IEMobile|Mobile/i.test(navigator.userAgent);

    /**
     * Inicia o fluxo de login com Google.
     * Mobile: usa redirect (mais confiavel em browsers moveis).
     * Desktop: usa popup.
     */
    export async function loginWithGoogle(): Promise<void> {
      try {
        if (isMobile()) {
          await signInWithRedirect(auth, googleProvider);
        } else {
          await signInWithPopup(auth, googleProvider);
        }
      } catch (error: any) {
        if (
          error?.code !== 'auth/popup-closed-by-user' &&
          error?.code !== 'auth/cancelled-popup-request'
        ) {
          console.error('Erro no login:', error);
          throw error;
        }
      }
    }

    export async function logout(): Promise<void> {
      await signOut(auth);
    }

    // Processa resultado de redirect (chamado no AuthProvider ao montar)
    export async function processRedirectResult(): Promise<void> {
      try {
        await getRedirectResult(auth);
      } catch (error: any) {
        if (
          error?.code !== 'auth/popup-closed-by-user' &&
          error?.code !== 'auth/cancelled-popup-request'
        ) {
          console.error('Erro no redirect result:', error);
        }
      }
    }
    