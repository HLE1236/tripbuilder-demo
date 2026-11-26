import { create } from 'zustand';
import type { User } from '../api/types';
import {
  clearAuthStorage,
  getAuthToken,
  getRefreshToken,
  getRememberMe,
  setAuthTokens,
} from '../config/storage/auth-storage';

export type AuthModalMode = 'login' | 'register' | 'forgot';

export interface AuthPendingIntent {
  type: 'customize' | 'favorite' | 'submit_booking';
  tourId: number;
}

export interface AuthModalState {
  open: boolean;
  mode: AuthModalMode;
  pendingIntent: AuthPendingIntent | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  rememberMe: boolean;
  authLoading: boolean;
  authModal: AuthModalState;

  setSession: (
    token: string,
    user: User,
    refreshToken?: string | null,
    rememberMe?: boolean
  ) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  clearSession: () => void;
  openAuthModal: (mode?: AuthModalMode, pendingIntent?: AuthPendingIntent | null) => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  closeAuthModal: () => void;
  clearPendingIntent: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: getAuthToken(),
  refreshToken: getRefreshToken(),
  rememberMe: getRememberMe(),
  authLoading: true,
  authModal: {
    open: false,
    mode: 'login',
    pendingIntent: null,
  },

  setSession: (token, user, refreshToken, rememberMe) => {
    const nextRememberMe = rememberMe ?? get().rememberMe;
    const nextRefreshToken = refreshToken !== undefined ? refreshToken : get().refreshToken;
    setAuthTokens(token, nextRefreshToken, nextRememberMe);
    set({
      token,
      refreshToken: nextRefreshToken,
      rememberMe: nextRememberMe,
      user,
      authLoading: false,
    });
  },

  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),

  clearSession: () => {
    clearAuthStorage();
    set({
      token: null,
      refreshToken: null,
      rememberMe: false,
      user: null,
      authLoading: false,
    });
  },

  openAuthModal: (mode = 'login', pendingIntent = null) =>
    set({
      authModal: {
        open: true,
        mode,
        pendingIntent,
      },
    }),

  setAuthModalMode: (mode) =>
    set((state) => ({
      authModal: {
        ...state.authModal,
        mode,
      },
    })),

  closeAuthModal: () =>
    set({
      authModal: {
        open: false,
        mode: 'login',
        pendingIntent: null,
      },
    }),

  clearPendingIntent: () =>
    set((state) => ({
      authModal: {
        ...state.authModal,
        pendingIntent: null,
      },
    })),
}));
