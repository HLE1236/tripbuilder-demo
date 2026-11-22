import { apiClient } from '@/api/client';
import type { Region } from '@/api/types';

export async function getRegionsApi(): Promise<Region[]> {
  const res = await apiClient.get('/api/regions');
  return res.data.data;
}
