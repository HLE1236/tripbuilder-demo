import { apiClient } from '@/api/client';

export async function markNotificationReadApi(id: number): Promise<void> {
  await apiClient.post(`/api/notifications/${id}/read`);
}
