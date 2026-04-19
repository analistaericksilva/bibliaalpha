import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, UserProfile, loginWithGoogle } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Timeout global: se Firebase não responder em 6s, desbloqueia
    const authTimer = setTimeout(() => {
      console.warn('Auth timeout — desbloqueando tela');
      setLoading(false);
    }, 6000);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        clearTimeout(authTimer);
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Usa getDoc (uma vez) em vez de onSnapshot (stream) — mais simples e robusto
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const profileTimer = setTimeout(() => {
            console.warn('Profile getDoc timeout');
            setLoading(false);
          }, 5000);

          const docSnap = await getDoc(userDocRef);
          clearTimeout(profileTimer);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            // Cria perfil novo
            const isSuperAdmin = firebaseUser.email === 'analista.ericksilva@gmail.com';
            const newProfile: UserProfile = {
              email: firebaseUser.email || '',
              nome: firebaseUser.displayName || 'Sem Nome',
              foto: firebaseUser.photoURL || '',
              status: isSuperAdmin ? 'approved' : 'pending',
              isAdmin: isSuperAdmin,
            };
            try {
              await setDoc(userDocRef, {
                ...newProfile,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });
              setProfile(newProfile);
            } catch (e) {
              console.error('Erro ao criar perfil:', e);
              // Mesmo sem salvar, permite super admin entrar
              if (isSuperAdmin) {
                setProfile({ ...newProfile, status: 'approved', isAdmin: true });
              } else {
                setProfile(null);
              }
            }
          }
        } catch (e) {
          console.error('Erro ao buscar perfil:', e);
          // Se for super admin, entra mesmo sem perfil no Firestore
          if (firebaseUser.email === 'analista.ericksilva@gmail.com') {
            setProfile({
              email: firebaseUser.email,
              nome: firebaseUser.displayName || 'Erick Silva',
              foto: firebaseUser.photoURL || '',
              status: 'approved',
              isAdmin: true,
            });
          } else {
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
        login: loginWithGoogle,
        logout: () => auth.signOut(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
