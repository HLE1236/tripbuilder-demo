const TOKEN_KEY = 'tb_client_token';
const REFRESH_TOKEN_KEY = 'tb_client_refresh_token';
const REMEMBER_ME_KEY = 'tb_client_remember_me';

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getRememberMe(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(TOKEN_KEY)) return true;
  return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
}

export function setAuthToken(token: string | null, rememberMe?: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);

  if (token) {
    const useLocal = rememberMe ?? getRememberMe();
    const target = useLocal ? localStorage : sessionStorage;
    target.setItem(TOKEN_KEY, token);
  }
}

export function setAuthTokens(
  token: string | null,
  refreshToken: string | null,
  rememberMe: boolean
): void {
  if (typeof window === 'undefined') return;
  clearAuthStorage();

  if (token) {
    const target = rememberMe ? localStorage : sessionStorage;
    target.setItem(TOKEN_KEY, token);
    if (refreshToken) {
      target.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    if (rememberMe) {
      localStorage.setItem(REMEMBER_ME_KEY, 'true');
    }
  }
}

export function clearAuthStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
