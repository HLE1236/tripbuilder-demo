import { apiClient } from '@/api/client';
import type { AuthResponse } from '@/api/types';

export async function refreshTokenApi(refreshToken: string): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/refresh', { refreshToken });
  return res.data.data;
}
