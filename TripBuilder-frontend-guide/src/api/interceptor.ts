import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { refreshTokenApi } from '@/api/auth/refresh.api';
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  setAuthTokens,
} from '@/config/storage/auth-storage';

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const SKIP_REFRESH_PATHS = ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout'];

let unauthorizedHandler: (() => void) | null = null;
let refreshPromise: Promise<string | null> | null = null;
const configuredClients = new WeakSet<AxiosInstance>();

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

function performSingleFlightRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return Promise.resolve(null);
  }

  refreshPromise = refreshTokenApi(refreshToken)
    .then((data) => {
      setAuthTokens(data.token, data.refreshToken);
      return data.token;
    })
    .catch(() => null)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function setupInterceptors(client: AxiosInstance): void {
  if (configuredClients.has(client)) return;
  configuredClients.add(client);

  client.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ message?: string }>) => {
      const originalRequest = error.config as RetriableRequestConfig | undefined;
      const status = error.response?.status;

      if (
        status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !shouldSkipRefresh(originalRequest.url)
      ) {
        originalRequest._retry = true;
        const newToken = await performSingleFlightRefresh();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        }
        clearAuthTokens();
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      } else if (status === 401 && !shouldSkipRefresh(originalRequest?.url)) {
        clearAuthTokens();
        if (unauthorizedHandler) {
          unauthorizedHandler();
        }
      }

      const message =
        error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
      return Promise.reject(new Error(message));
    }
  );
}
