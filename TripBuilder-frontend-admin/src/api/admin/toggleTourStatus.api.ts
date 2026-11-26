import { apiClient } from '../client';
import type { Tour } from '../types';

export async function toggleTourStatusApi(tourId: number, active: boolean): Promise<Tour> {
  const res = await apiClient.patch(`/api/tours/${tourId}/status`, { active });
  return res.data.data;
}
