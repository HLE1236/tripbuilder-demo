import { apiClient } from '@/api/client';

export async function logoutApi(payload: { refreshToken?: string | null }): Promise<void> {
  await apiClient.post('/api/auth/logout', payload);
}
