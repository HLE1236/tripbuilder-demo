import { apiClient } from '@/api/client';
import type { Tour } from '@/api/types';

export async function getToursApi(
  guideId?: number,
  includeInactive = false
): Promise<Tour[]> {
  const params = new URLSearchParams();
  if (guideId) params.set('guideId', String(guideId));
  if (includeInactive) params.set('includeInactive', 'true');
  const qs = params.toString();
  const url = qs ? `/api/tours?${qs}` : '/api/tours';
  const res = await apiClient.get(url);
  return res.data.data;
}
