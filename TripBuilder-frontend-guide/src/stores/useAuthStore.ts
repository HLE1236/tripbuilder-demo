import { create } from 'zustand';
import type { AuthResponse, User } from '@/api/types';
import {
  clearAuthTokens,
  getAuthToken,
  setAuthTokens,
} from '@/config/storage/auth-storage';

interface AuthState {
  user: User | null;
  authChecking: boolean;
  authError: string;
  setUser: (user: User | null) => void;
  setSession: (auth: AuthResponse, rememberMe?: boolean) => void;
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
  setSession: (auth, rememberMe = false) => {
    setAuthTokens(auth.token, auth.refreshToken, rememberMe);
    set({ user: auth.user, authError: '', authChecking: false });
  },
  setAuthChecking: (authChecking) => set({ authChecking }),
  setAuthError: (authError) => set({ authError }),
  logout: () => {
    clearAuthTokens();
    set({ user: null, authChecking: false });
  },
}));
