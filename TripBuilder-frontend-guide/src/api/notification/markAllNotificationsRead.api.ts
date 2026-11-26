import { apiClient } from '@/api/client';

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiClient.post('/api/notifications/read-all');
}
