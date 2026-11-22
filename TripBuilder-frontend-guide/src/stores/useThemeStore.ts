import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark';

const THEME_KEY = 'tb_guide_theme';

function getInitialTheme(): ThemeMode {
  return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
}

function applyThemeToDom(mode: ThemeMode): void {
  localStorage.setItem(THEME_KEY, mode);
  document.documentElement.classList.toggle('dark', mode === 'dark');
  document.documentElement.setAttribute('data-theme', mode);
}

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: getInitialTheme(),
  setMode: (mode) => {
    applyThemeToDom(mode);
    set({ mode });
  },
  toggleMode: () => {
    const next: ThemeMode = get().mode === 'light' ? 'dark' : 'light';
    applyThemeToDom(next);
    set({ mode: next });
  },
}));
