import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptBookingApi,
  cancelBookingApi,
  completeBookingApi,
  getBookingByIdApi,
  getBookingsApi,
  rejectBookingChangeApi,
  requoteBookingApi,
  type RequoteBookingPayload,
} from '@/api/booking';
import type { Booking } from '@/api/types';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: () => [...bookingKeys.all, 'list'] as const,
  detail: (bookingId: number) => [...bookingKeys.all, 'detail', bookingId] as const,
};

export function useBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: bookingKeys.list(),
    queryFn: getBookingsApi,
    enabled,
  });
}

export function useBookingDetailQuery(bookingId: number | null) {
  return useQuery({
    queryKey: bookingKeys.detail(bookingId ?? 0),
    queryFn: () => getBookingByIdApi(bookingId!),
    enabled: Boolean(bookingId),
  });
}

export function useRequoteBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: number;
      payload: RequoteBookingPayload;
    }) => requoteBookingApi(bookingId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated]
      );
      queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      cancelBookingApi(bookingId, reason),
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated]
      );
      queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
    },
  });
}

export function useAcceptBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => acceptBookingApi(bookingId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated]
      );
      queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
    },
  });
}

export function useRejectBookingChangeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => rejectBookingChangeApi(bookingId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated]
      );
      queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
    },
  });
}

export function useCompleteBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => completeBookingApi(bookingId),
    onSuccess: (updated) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated]
      );
      queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
    },
  });
}
