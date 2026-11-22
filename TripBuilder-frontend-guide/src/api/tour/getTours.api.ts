import { apiClient } from '@/api/client';
import type { Tour } from '@/api/types';

export async function getToursApi(guideId?: number): Promise<Tour[]> {
  const url = guideId ? `/api/tours?guideId=${guideId}` : '/api/tours';
  const res = await apiClient.get(url);
  return res.data.data;
}
