import { apiClient } from '../client';
import type { Tour, TourFilterParams } from '../types';

export async function getToursApi(params?: TourFilterParams): Promise<Tour[]> {
  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
      )
    : undefined;

  const res = await apiClient.get('/api/tours', {
    params: cleanParams && Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
  });
  return res.data.data;
}

export const getTours = getToursApi;
