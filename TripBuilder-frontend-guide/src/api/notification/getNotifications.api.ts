import { apiClient } from '@/api/client';
import type { NotificationListResponse } from '@/api/types';

export async function getNotificationsApi(): Promise<NotificationListResponse> {
  const res = await apiClient.get('/api/notifications');
  return res.data.data;
}
