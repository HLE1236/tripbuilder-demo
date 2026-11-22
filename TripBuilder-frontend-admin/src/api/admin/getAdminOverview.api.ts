import { apiClient } from '../client';
import type { AdminOverview } from '../types';

export async function getAdminOverviewApi(): Promise<AdminOverview> {
  const res = await apiClient.get('/api/admin/overview');
  return res.data.data;
}
