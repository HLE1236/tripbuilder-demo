import { create } from 'zustand';
import type { User } from '../api/types';
import { getAuthToken, setAuthToken } from '../config/storage/auth-storage';

interface AuthState {
  user: User | null;
  token: string | null;
  bootstrapping: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (user: User | null) => void;
  setBootstrapping: (bootstrapping: boolean) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getAuthToken(),
  bootstrapping: Boolean(getAuthToken()),

  setSession: (token, user) => {
    setAuthToken(token);
    set({ token, user, bootstrapping: false });
  },

  setUser: (user) => set({ user }),

  setBootstrapping: (bootstrapping) => set({ bootstrapping }),

  clearSession: () => {
    setAuthToken(null);
    set({ token: null, user: null, bootstrapping: false });
  },
}));
