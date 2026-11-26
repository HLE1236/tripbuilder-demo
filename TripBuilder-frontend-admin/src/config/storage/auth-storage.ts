export const ADMIN_TOKEN_KEY = 'tb_admin_token';
export const ADMIN_REFRESH_TOKEN_KEY = 'tb_admin_refresh_token';
export const ADMIN_THEME_KEY = 'tb_admin_theme';

export function getAuthToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY) ?? sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return (
    localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ??
    sessionStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
  );
}

export function clearAuthTokens(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  sessionStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
}

export function setAuthTokens(
  token: string | null,
  refreshToken: string | null,
  rememberMe?: boolean
): void {
  const wasRemembered = Boolean(
    localStorage.getItem(ADMIN_TOKEN_KEY) || localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
  );
  const useLocal = rememberMe ?? wasRemembered;

  clearAuthTokens();

  if (token) {
    const storage = useLocal ? localStorage : sessionStorage;
    storage.setItem(ADMIN_TOKEN_KEY, token);
    if (refreshToken) {
      storage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
    }
  }
}

export function setAuthToken(token: string | null): void {
  if (!token) {
    clearAuthTokens();
    return;
  }
  setAuthTokens(token, getRefreshToken());
}

export function getStoredTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem(ADMIN_THEME_KEY);
  return saved === 'dark' ? 'dark' : 'light';
}

export function setStoredTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(ADMIN_THEME_KEY, theme);
}
