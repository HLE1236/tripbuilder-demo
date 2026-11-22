import { apiClient } from '../client';
import type { PhotoItem } from '../types';

export async function getRegionPhotosApi(regionId: number, category?: string): Promise<PhotoItem[]> {
  const res = await apiClient.get(`/api/regions/${regionId}/photos`, {
    params: category ? { category } : undefined,
  });
  return res.data.data;
}

export const getRegionPhotos = getRegionPhotosApi;
