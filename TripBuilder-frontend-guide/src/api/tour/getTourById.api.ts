import { apiClient } from '@/api/client';
import type { Tour } from '@/api/types';

export async function getTourByIdApi(tourId: number): Promise<Tour> {
  const res = await apiClient.get(`/api/tours/${tourId}`);
  return res.data.data;
}
