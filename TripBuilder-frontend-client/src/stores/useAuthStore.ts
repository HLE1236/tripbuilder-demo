import { create } from 'zustand';
import type { User } from '../api/types';
import { getAuthToken, setAuthToken } from '../config/storage/auth-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  authLoading: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAuthToken(),
  authLoading: true,
  setSession: (token, user) => {
    setAuthToken(token);
    set({ token, user, authLoading: false });
  },
  setUser: (user) => set({ user }),
  setAuthLoading: (authLoading) => set({ authLoading }),
  clearSession: () => {
    setAuthToken(null);
    set({ token: null, user: null, authLoading: false });
  },
}));
