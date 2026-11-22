import { apiClient } from '@/api/client';
import type { DemoAccount } from '@/api/types';

export async function getDemoAccountsApi(): Promise<DemoAccount[]> {
  const res = await apiClient.get('/api/auth/demo-accounts?role=GUIDE');
  return res.data.data;
}
