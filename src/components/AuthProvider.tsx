import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
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
    let profileUnsub: (() => void) | null = null;

    // Timeout global: 6s para o auth resolver, 5s para o profile
    // Se qualquer um travar, desbloqueia a tela
    const authTimer = setTimeout(() => {
      console.warn('Auth timeout — desbloqueando tela');
      setLoading(false);
    }, 6000);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        clearTimeout(authTimer);
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // Timeout para o Firestore profile
        const profileTimer = setTimeout(() => {
          console.warn('Profile timeout — desbloqueando tela sem profile');
          setLoading(false);
        }, 5000);

        profileUnsub = onSnapshot(
          doc(db, 'users', firebaseUser.uid),
          async (docSnap) => {
            clearTimeout(profileTimer);
            if (docSnap.exists()) {
              setProfile(docSnap.data() as UserProfile);
            } else {
              try {
                const userDocRef = doc(db, 'users', firebaseUser.uid);
                const { serverTimestamp, setDoc } = await import('firebase/firestore');
                const isSuperAdmin = firebaseUser.email === 'analista.ericksilva@gmail.com';
                await setDoc(userDocRef, {
                  email: firebaseUser.email,
                  nome: firebaseUser.displayName || 'Sem Nome',
                  foto: firebaseUser.photoURL || '',
                  status: isSuperAdmin ? 'approved' : 'pending',
                  isAdmin: isSuperAdmin,
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                });
              } catch (e) {
                console.error('Failed to create profile', e);
                setProfile(null);
              }
            }
            setLoading(false);
          },
          (error) => {
            clearTimeout(profileTimer);
            console.error('Profile snapshot error:', error);
            setLoading(false);
          }
        );
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
      if (profileUnsub) profileUnsub();
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
