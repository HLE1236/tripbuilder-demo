import type { AxiosInstance } from 'axios';
import { getAuthToken } from '../config/storage/auth-storage';
import { useAuthStore } from '../stores/useAuthStore';
import { apiClient } from './client';

let unauthorizedHandler: (() => void) | null = null;
const configuredClients = new WeakSet<AxiosInstance>();

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
}

export function setupInterceptors(client: AxiosInstance): AxiosInstance {
  if (configuredClients.has(client)) {
    return client;
  }
  configuredClients.add(client);

  client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token ?? getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (unauthorizedHandler) {
          unauthorizedHandler();
        } else {
          useAuthStore.getState().clearSession();
        }
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
