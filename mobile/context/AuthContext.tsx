// /mobile/context/AuthContext.tsx
// Shared auth state — lets any screen trigger the Login → Main stack switch
// without needing a reference to the RootStack navigator.

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getToken, clearToken } from '../../shared/api-client';

interface JwtPayload {
  userId: string;
  email: string;
  exp: number;
}

function decodeToken(token: string): JwtPayload | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as JwtPayload;
    return payload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  return payload.exp * 1000 < Date.now();
}

interface AuthContextType {
  isAuthenticated: boolean | null; // null = still checking
  userId: string | null;
  userEmail: string | null;
  setIsAuthenticated: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: null,
  userId: null,
  userEmail: null,
  setIsAuthenticated: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) { setIsAuthenticated(false); return; }
        const payload = decodeToken(token);
        if (!payload || isTokenExpired(payload)) { setIsAuthenticated(false); return; }
        setUserId(payload.userId);
        setUserEmail(payload.email);
        setIsAuthenticated(true);
      } catch {
        setIsAuthenticated(false);
      }
    })();
  }, []);

  // Re-decode whenever auth flips to true (after login/signup)
  // Screens call setIsAuthenticated(true) after storeToken — we re-read at that point.
  useEffect(() => {
    if (!isAuthenticated) {
      setUserId(null);
      setUserEmail(null);
      return;
    }
    (async () => {
      const token = await getToken();
      if (!token) return;
      const payload = decodeToken(token);
      if (payload) {
        setUserId(payload.userId);
        setUserEmail(payload.email);
      }
    })();
  }, [isAuthenticated]);

  async function signOut(): Promise<void> {
    await clearToken();
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, userEmail, setIsAuthenticated, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}
