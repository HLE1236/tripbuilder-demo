import { apiClient } from '../client';
import type { Region } from '../types';

export async function getAdminRegionsApi(): Promise<Region[]> {
  const res = await apiClient.get('/api/regions');
  return res.data.data;
}
