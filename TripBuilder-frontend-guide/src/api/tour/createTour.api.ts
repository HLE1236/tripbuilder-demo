import { apiClient } from '@/api/client';
import type { SaveTourPayload, Tour } from '@/api/types';

export async function createTourApi(payload: SaveTourPayload): Promise<Tour> {
  const { galleryImages, galleryUrls, ...rest } = payload;
  const res = await apiClient.post('/api/tours', {
    ...rest,
    galleryUrls: galleryUrls ?? galleryImages,
  });
  return res.data.data;
}
