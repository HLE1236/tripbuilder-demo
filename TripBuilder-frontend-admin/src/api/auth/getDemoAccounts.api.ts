import { apiClient } from '../client';
import type { DemoAccount, UserRole } from '../types';

export async function getDemoAccountsApi(role: UserRole = 'ADMIN'): Promise<DemoAccount[]> {
  const res = await apiClient.get('/api/auth/demo-accounts', {
    params: { role },
  });
  return res.data.data;
}
