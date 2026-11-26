const TOKEN_KEY = 'tb_guide_token';
const REFRESH_TOKEN_KEY = 'tb_guide_refresh_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) ?? sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens(
  token: string | null,
  refreshToken: string | null,
  rememberMe?: boolean
): void {
  const wasRemembered = Boolean(
    localStorage.getItem(TOKEN_KEY) || localStorage.getItem(REFRESH_TOKEN_KEY)
  );
  const useLocal = rememberMe ?? wasRemembered;

  clearAuthTokens();

  if (token) {
    const storage = useLocal ? localStorage : sessionStorage;
    storage.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
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
