import { apiClient } from '../client';

export async function getFavoritesApi(): Promise<number[]> {
  const res = await apiClient.get('/api/favorites');
  return res.data.data;
}

export const getFavoriteTourIds = getFavoritesApi;
export const getFavorites = getFavoritesApi;
