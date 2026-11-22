import { apiClient } from '../client';

export async function removeFavoriteApi(tourId: number): Promise<number[]> {
  const res = await apiClient.delete(`/api/favorites/${tourId}`);
  return res.data.data;
}

export const removeFavoriteTour = removeFavoriteApi;
