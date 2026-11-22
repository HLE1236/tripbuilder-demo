import { apiClient } from '@/api/client';
import type { User } from '@/api/types';

export async function getMeApi(): Promise<User> {
  const res = await apiClient.get('/api/auth/me');
  return res.data.data;
}
