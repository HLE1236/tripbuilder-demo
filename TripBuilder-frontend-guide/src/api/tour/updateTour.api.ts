import { apiClient } from '@/api/client';
import type { SaveTourPayload, Tour } from '@/api/types';

export async function updateTourApi(
  tourId: number,
  payload: SaveTourPayload
): Promise<Tour> {
  const { galleryImages, galleryUrls, ...rest } = payload;
  const res = await apiClient.put(`/api/tours/${tourId}`, {
    ...rest,
    galleryUrls: galleryUrls ?? galleryImages,
  });
  return res.data.data;
}
