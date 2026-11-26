import { apiClient } from '../client';
import type { NotificationListResponse } from '../types';

export async function getNotificationsApi(): Promise<NotificationListResponse> {
  const res = await apiClient.get('/api/notifications');
  return res.data.data;
}

export async function markNotificationReadApi(id: number): Promise<void> {
  await apiClient.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsReadApi(): Promise<void> {
  await apiClient.post('/api/notifications/read-all');
}
