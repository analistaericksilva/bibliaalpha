import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [readingPosition, setReadingPosition] = useState(0);

    // Session persistence with localStorage fallback
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        const storedPosition = localStorage.getItem('readingPosition');
        if (storedPosition) {
            setReadingPosition(parseInt(storedPosition, 10));
        }
    }, []);

    const signOut = () => {
        setUser(null);
        setReadingPosition(0);
        localStorage.removeItem('user');
        localStorage.removeItem('readingPosition');
    };

    const value = { user, setUser, readingPosition, setReadingPosition, signOut };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};