import { apiClient } from '../client';
import type { PhotoItem } from '../types';

export async function getAllRegionPhotosApi(category?: string): Promise<PhotoItem[]> {
  const res = await apiClient.get('/api/regions/photos', {
    params: category ? { category } : undefined,
  });
  return res.data.data;
}

export const getAllRegionPhotos = getAllRegionPhotosApi;
