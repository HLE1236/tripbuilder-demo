import { create } from 'zustand';
import { getStoredTheme, setStoredTheme } from '../config/storage/auth-storage';

export type ThemeMode = 'light' | 'dark';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getStoredTheme(),

  setTheme: (theme) => {
    setStoredTheme(theme);
    set({ theme });
  },

  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode = state.theme === 'light' ? 'dark' : 'light';
      setStoredTheme(next);
      return { theme: next };
    }),
}));
