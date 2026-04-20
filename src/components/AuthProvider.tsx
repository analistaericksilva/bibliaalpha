import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, UserProfile, loginWithGoogle, processRedirectResult } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileError: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  profileError: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    const authTimer = setTimeout(() => {
      console.warn('Auth timeout — desbloqueando tela');
      setLoading(false);
    }, 8000);

    processRedirectResult(); // processa redirect do mobile
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        clearTimeout(authTimer);
        setUser(firebaseUser);
        setProfileError(null);

        if (!firebaseUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        const isSuperAdminUser = firebaseUser.email === 'analista.ericksilva@gmail.com';

        const superAdminFallback: UserProfile = {
          email: firebaseUser.email || '',
          nome: firebaseUser.displayName || 'Erick Silva',
          foto: firebaseUser.photoURL || '',
          status: 'approved',
          isAdmin: true,
        };

        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);

          const profileTimer = setTimeout(() => {
            console.warn('Profile getDoc timeout');
            if (isSuperAdminUser) {
              setProfile(superAdminFallback);
            } else {
              setProfileError('Timeout ao acessar Firestore. Verifique sua conexao.');
            }
            setLoading(false);
          }, 5000);

          const docSnap = await getDoc(userDocRef);
          clearTimeout(profileTimer);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              email: firebaseUser.email || '',
              nome: firebaseUser.displayName || 'Sem Nome',
              foto: firebaseUser.photoURL || '',
              status: isSuperAdminUser ? 'approved' : 'pending',
              isAdmin: isSuperAdminUser,
            };

            try {
              await setDoc(userDocRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              setProfile(newProfile);
            } catch (e: any) {
              console.error('Erro ao criar perfil:', e);
              if (isSuperAdminUser) {
                setProfile(superAdminFallback);
              } else {
                const errCode = e?.code || e?.message || 'desconhecido';
                setProfileError(
                  errCode === 'permission-denied'
                    ? 'Permissao negada pelo Firestore. Contate o administrador.'
                    : `Erro ao criar perfil: ${errCode}`
                );
                setProfile(null);
              }
            }
          }
        } catch (e: any) {
          console.error('Erro ao buscar perfil:', e);
          if (isSuperAdminUser) {
            setProfile(superAdminFallback);
          } else {
            const msg = e?.code === 'permission-denied'
              ? 'Acesso negado pelo Firestore. Security Rules precisam permitir leitura em /users/{uid}.'
              : `Erro ao acessar perfil: ${e?.code || e?.message || 'desconhecido'}`;
            setProfileError(msg);
            setProfile(null);
          }
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        clearTimeout(authTimer);
        console.error('Auth error:', error);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(authTimer);
      unsubscribeAuth();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileError,
        login: loginWithGoogle,
        logout: () => auth.signOut(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
