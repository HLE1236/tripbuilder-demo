import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelBookingApi,
  confirmBookingApi,
  createBookingApi,
  customizeBookingApi,
  getBookingByIdApi,
  getBookingsApi,
  reviewBookingApi,
  type CreateBookingPayload,
  type CustomizeBookingPayload,
  type ReviewBookingPayload,
} from '../../api/booking';
import type { Booking } from '../../api/types';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: () => [...bookingKeys.all, 'list'] as const,
  detail: (id: number) => [...bookingKeys.all, 'detail', id] as const,
};

function syncBookingInCache(queryClient: ReturnType<typeof useQueryClient>, updated: Booking) {
  queryClient.setQueryData(bookingKeys.detail(updated.id), updated);
  queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) => {
    if (!prev) return [updated];
    const exists = prev.some((item) => item.id === updated.id);
    if (!exists) return [updated, ...prev];
    return prev.map((item) => (item.id === updated.id ? updated : item));
  });
}

export function useBookingsQuery(enabled = true) {
  return useQuery({
    queryKey: bookingKeys.list(),
    queryFn: getBookingsApi,
    enabled,
  });
}

export function useBookingDetailQuery(id: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: bookingKeys.detail(id ?? 0),
    queryFn: () => getBookingByIdApi(id as number),
    enabled: enabled && Boolean(id),
  });
}

export function useCreateBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => createBookingApi(payload),
    onSuccess: (created) => {
      syncBookingInCache(queryClient, created);
      queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}

export function useCustomizeBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: number;
      payload: CustomizeBookingPayload;
    }) => customizeBookingApi(bookingId, payload),
    onSuccess: (updated) => {
      syncBookingInCache(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}

export function useConfirmBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) => confirmBookingApi(bookingId),
    onSuccess: (updated) => {
      syncBookingInCache(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bookingId: number) => cancelBookingApi(bookingId),
    onSuccess: (updated) => {
      syncBookingInCache(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}

export function useReviewBookingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      bookingId,
      payload,
    }: {
      bookingId: number;
      payload: ReviewBookingPayload;
    }) => reviewBookingApi(bookingId, payload),
    onSuccess: (updated) => {
      syncBookingInCache(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
    },
  });
}
