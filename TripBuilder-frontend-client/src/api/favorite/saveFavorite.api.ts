import { apiClient } from '../client';

export async function saveFavoriteApi(tourId: number): Promise<number[]> {
  const res = await apiClient.post(`/api/favorites/${tourId}`);
  return res.data.data;
}

export const saveFavoriteTour = saveFavoriteApi;
