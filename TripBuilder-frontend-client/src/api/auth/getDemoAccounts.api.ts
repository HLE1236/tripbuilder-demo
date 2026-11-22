import { apiClient } from '../client';
import type { DemoAccount } from '../types';

export async function getDemoAccountsApi(): Promise<DemoAccount[]> {
  const res = await apiClient.get('/api/auth/demo-accounts', {
    params: { role: 'CUSTOMER' },
  });
  return res.data.data;
}

export const getDemoAccounts = getDemoAccountsApi;
