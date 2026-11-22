import { apiClient } from '@/api/client';
import type { PhotoItem } from '@/api/types';

export async function getAllRegionPhotosApi(category?: string): Promise<PhotoItem[]> {
  const res = await apiClient.get('/api/regions/photos', {
    params: category ? { category } : undefined,
  });
  return res.data.data;
}
