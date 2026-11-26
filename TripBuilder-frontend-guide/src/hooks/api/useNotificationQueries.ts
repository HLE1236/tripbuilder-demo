import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationsApi,
  markAllNotificationsReadApi,
  markNotificationReadApi,
} from '@/api/notification';
import type { NotificationListResponse } from '@/api/types';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: () => [...notificationKeys.all, 'list'] as const,
};

export function useNotificationsQuery(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list(),
    queryFn: getNotificationsApi,
    enabled,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => markNotificationReadApi(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData<NotificationListResponse>(
        notificationKeys.list(),
        (prev) => {
          if (!prev) return prev;
          const items = prev.items.map((item) =>
            item.id === id ? { ...item, read: true } : item
          );
          const unreadCount = items.filter((item) => !item.read).length;
          return { unreadCount, items };
        }
      );
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsReadApi(),
    onSuccess: () => {
      queryClient.setQueryData<NotificationListResponse>(
        notificationKeys.list(),
        (prev) => {
          if (!prev) return prev;
          return {
            unreadCount: 0,
            items: prev.items.map((item) => ({ ...item, read: true })),
          };
        }
      );
    },
  });
}
