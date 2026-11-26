import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getAuthToken, getRefreshToken } from '../config/storage/auth-storage';
import { useAuthStore } from '../stores/useAuthStore';
import type { AuthResponse } from './types';
import { apiClient } from './client';

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const SKIP_REFRESH_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
];

let unauthorizedHandler: (() => void) | null = null;
let refreshFlight: Promise<string | null> | null = null;
const configuredClients = new WeakSet<AxiosInstance>();

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

function shouldSkipRefresh(url?: string): boolean {
  if (!url) return false;
  return SKIP_REFRESH_PATHS.some((path) => url.includes(path));
}

function handleAuthFailure(): void {
  if (unauthorizedHandler) {
    unauthorizedHandler();
  } else {
    useAuthStore.getState().clearSession();
  }
}

async function performSingleFlightRefresh(client: AxiosInstance): Promise<string | null> {
  if (refreshFlight) {
    return refreshFlight;
  }

  refreshFlight = (async () => {
    const storeState = useAuthStore.getState();
    const refreshToken = storeState.refreshToken ?? getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const res = await client.post<{ data: AuthResponse }>('/api/auth/refresh', {
        refreshToken,
      });
      const data = res.data.data;
      storeState.setSession(
        data.token,
        data.user,
        data.refreshToken,
        storeState.rememberMe
      );
      return data.token;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshFlight = null;
  });

  return refreshFlight;
}

export function setupInterceptors(client: AxiosInstance): AxiosInstance {
  if (configuredClients.has(client)) {
    return client;
  }
  configuredClients.add(client);

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token ?? getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalConfig = error.config as RetryableRequestConfig | undefined;
      const status = error.response?.status;

      if (
        status === 401 &&
        originalConfig &&
        !originalConfig._retry &&
        !shouldSkipRefresh(originalConfig.url)
      ) {
        originalConfig._retry = true;
        const newToken = await performSingleFlightRefresh(client);
        if (newToken) {
          originalConfig.headers.Authorization = `Bearer ${newToken}`;
          return client(originalConfig);
        }
        handleAuthFailure();
      } else if (status === 401 && !shouldSkipRefresh(originalConfig?.url)) {
        handleAuthFailure();
      }

      const message =
        error.response?.data?.message ||
        error.message ||
        'Lỗi kết nối máy chủ';

      return Promise.reject(new Error(message));
    }
  );

  return client;
}

setupInterceptors(apiClient);
