import { apiClient } from '../client';

export async function logoutApi(refreshToken?: string | null): Promise<void> {
  await apiClient.post('/api/auth/logout', {
    refreshToken: refreshToken || undefined,
  });
}
