export const ADMIN_TOKEN_KEY = 'tb_admin_token';
export const ADMIN_THEME_KEY = 'tb_admin_theme';

export function getAuthToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export function getStoredTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(ADMIN_THEME_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(ADMIN_THEME_KEY, theme);
}
