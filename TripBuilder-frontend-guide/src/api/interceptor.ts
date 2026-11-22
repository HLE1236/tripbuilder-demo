import type { AxiosInstance } from 'axios';
import { getAuthToken } from '@/config/storage/auth-storage';

let unauthorizedHandler: (() => void) | null = null;
const configuredClients = new WeakSet<AxiosInstance>();

export function setUnauthorizedHandler(fn: (() => void) | null): void {
  unauthorizedHandler = fn;
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
    (error) => {
      if (error.response?.status === 401 && unauthorizedHandler) {
        unauthorizedHandler();
      }
      const message =
        error.response?.data?.message || error.message || 'Lỗi kết nối máy chủ';
      return Promise.reject(new Error(message));
    }
  );
}
