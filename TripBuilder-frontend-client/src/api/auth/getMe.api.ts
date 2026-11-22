import { apiClient } from '../client';
import type { User } from '../types';

export async function getMeApi(): Promise<User> {
  const res = await apiClient.get('/api/auth/me');
  return res.data.data;
}

export const authMe = getMeApi;
