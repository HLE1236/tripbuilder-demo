import { apiClient } from '@/api/client';

export async function deleteTourApi(tourId: number): Promise<void> {
  await apiClient.delete(`/api/tours/${tourId}`);
}
