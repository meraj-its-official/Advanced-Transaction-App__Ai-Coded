import { create } from 'zustand';
import { clearTokens } from '@/lib/auth';
import { authClient } from '@/lib/better-auth-client';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isVerified: boolean;
  hasPin?: boolean;
  createdAt: string;
}

interface Wallet {
  id: string;
  balance: number;
  currency: string;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  wallet: Wallet | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setHasPin: (hasPin: boolean) => void;
  setWallet: (wallet: Wallet | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  wallet: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setHasPin: (hasPin) =>
    set((state) => ({
      user: state.user ? { ...state.user, hasPin } : null,
    })),

  setWallet: (wallet) =>
    set({ wallet }),

  setLoading: (isLoading) =>
    set({ isLoading }),

  logout: () => {
    try {
      authClient.signOut().catch(() => {});
    } catch {}
    clearTokens();
    set({ user: null, wallet: null, isAuthenticated: false, isLoading: false });
  },

  updateBalance: (balance) =>
    set((state) => ({
      wallet: state.wallet ? { ...state.wallet, balance } : null,
    })),
}));
