import { apiClient } from '../client';
import type { Tour } from '../types';

export async function getAdminToursApi(): Promise<Tour[]> {
  const res = await apiClient.get('/api/admin/tours');
  return res.data.data;
}
