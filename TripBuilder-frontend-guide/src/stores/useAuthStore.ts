import { create } from 'zustand';
import type { User } from '@/api/types';
import { getAuthToken, setAuthToken } from '@/config/storage/auth-storage';

interface AuthState {
  user: User | null;
  authChecking: boolean;
  authError: string;
  setUser: (user: User | null) => void;
  setSession: (token: string, user: User) => void;
  setAuthChecking: (checking: boolean) => void;
  setAuthError: (error: string) => void;
  logout: () => void;
}

const hasInitialToken = Boolean(getAuthToken());

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  authChecking: hasInitialToken,
  authError: '',
  setUser: (user) => set({ user }),
  setSession: (token, user) => {
    setAuthToken(token);
    set({ user, authError: '', authChecking: false });
  },
  setAuthChecking: (authChecking) => set({ authChecking }),
  setAuthError: (authError) => set({ authError }),
  logout: () => {
    setAuthToken(null);
    set({ user: null, authChecking: false });
  },
}));
