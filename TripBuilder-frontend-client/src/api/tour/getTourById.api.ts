import { apiClient } from '../client';
import type { Tour } from '../types';

export async function getTourByIdApi(id: number): Promise<Tour> {
  const res = await apiClient.get(`/api/tours/${id}`);
  return res.data.data;
}

export const getTour = getTourByIdApi;
