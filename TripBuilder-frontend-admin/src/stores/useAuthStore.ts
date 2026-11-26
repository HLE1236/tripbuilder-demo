import { create } from 'zustand';
import type { AuthResponse, User } from '../api/types';
import {
  clearAuthTokens,
  getAuthToken,
  setAuthTokens,
} from '../config/storage/auth-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  bootstrapping: boolean;
  setSession: (auth: AuthResponse, rememberMe?: boolean) => void;
  setUser: (user: User | null) => void;
  setBootstrapping: (bootstrapping: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAuthToken(),
  bootstrapping: Boolean(getAuthToken()),

  setSession: (auth, rememberMe = false) => {
    setAuthTokens(auth.token, auth.refreshToken, rememberMe);
    set({ token: auth.token, user: auth.user, bootstrapping: false });
  },

  setUser: (user) => set({ user }),

  setBootstrapping: (bootstrapping) => set({ bootstrapping }),

  clearSession: () => {
    clearAuthTokens();
    set({ token: null, user: null, bootstrapping: false });
  },
}));
