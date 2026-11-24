'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { getAccessToken, setTokens } from '@/lib/auth';
import { authClient } from '@/lib/better-auth-client';
import api from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, setUser, setWallet, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      try {
        let token = getAccessToken();
        let sessionData = null;

        // 1. Check Better Auth session
        try {
          const sessionRes = await authClient.getSession();
          if (sessionRes?.data?.session) {
            sessionData = sessionRes.data;
            if (sessionRes.data.session.token) {
              token = sessionRes.data.session.token;
              setTokens(token, token);
            }
          }
        } catch {
          // Session check skipped/offline
        }

        // 2. If neither Better Auth session nor JWT token exists, not authenticated
        if (!token && !sessionData?.user) {
          setLoading(false);
          return;
        }

        // 3. Fetch profile and wallet from backend API
        try {
          const [profileRes, walletRes] = await Promise.all([
            api.get('/auth/profile'),
            api.get('/wallet'),
          ]);
          setUser(profileRes.data?.data || profileRes.data);
          setWallet(walletRes.data?.data || walletRes.data);
        } catch {
          // If backend profile endpoint returned error but Better Auth session is valid,
          // populate minimal user state from session
          if (sessionData?.user) {
            setUser({
              id: sessionData.user.id,
              name: sessionData.user.name || 'User',
              email: sessionData.user.email,
              phone: (sessionData.user as { phone?: string }).phone || '',
              avatar: sessionData.user.image || undefined,
              isVerified: (sessionData.user as { emailVerified?: boolean }).emailVerified || false,
              hasPin: false,
              createdAt: sessionData.user.createdAt
                ? new Date(sessionData.user.createdAt).toISOString()
                : new Date().toISOString(),
            });
          }
        }
      } catch {
        // Init error
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setWallet, setLoading]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
