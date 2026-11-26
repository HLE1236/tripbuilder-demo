import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTourApi,
  deleteTourApi,
  getTourByIdApi,
  getToursApi,
  toggleTourStatusApi,
  updateTourApi,
} from '@/api/tour';
import type { SaveTourPayload, Tour } from '@/api/types';

export const tourKeys = {
  all: ['tours'] as const,
  list: (guideId?: number, includeInactive = true) =>
    [...tourKeys.all, 'list', guideId ?? 'all', includeInactive] as const,
  detail: (tourId: number) => [...tourKeys.all, 'detail', tourId] as const,
};

export function useToursQuery(
  guideId?: number,
  enabled = true,
  includeInactive = true
) {
  return useQuery({
    queryKey: tourKeys.list(guideId, includeInactive),
    queryFn: () => getToursApi(guideId, includeInactive),
    enabled,
  });
}

export function useTourDetailQuery(tourId: number | null) {
  return useQuery({
    queryKey: tourKeys.detail(tourId ?? 0),
    queryFn: () => getTourByIdApi(tourId!),
    enabled: Boolean(tourId),
  });
}

export function useCreateTourMutation(guideId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaveTourPayload) => createTourApi(payload),
    onSuccess: (created) => {
      queryClient.setQueryData<Tour[]>(tourKeys.list(guideId), (prev) =>
        prev ? [created, ...prev] : [created]
      );
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}

export function useUpdateTourMutation(guideId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tourId, payload }: { tourId: number; payload: SaveTourPayload }) =>
      updateTourApi(tourId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData<Tour[]>(tourKeys.list(guideId), (prev) =>
        prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : [updated]
      );
      queryClient.setQueryData(tourKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}

export function useDeleteTourMutation(guideId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tourId: number) => deleteTourApi(tourId),
    onSuccess: (_, tourId) => {
      queryClient.setQueryData<Tour[]>(tourKeys.list(guideId), (prev) =>
        prev ? prev.filter((t) => t.id !== tourId) : []
      );
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}

export function useToggleTourStatusMutation(guideId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tourId, active }: { tourId: number; active: boolean }) =>
      toggleTourStatusApi(tourId, active),
    onSuccess: (updated) => {
      queryClient.setQueryData<Tour[]>(tourKeys.list(guideId), (prev) =>
        prev ? prev.map((t) => (t.id === updated.id ? updated : t)) : [updated]
      );
      queryClient.setQueryData(tourKeys.detail(updated.id), updated);
      void queryClient.invalidateQueries({ queryKey: tourKeys.all });
    },
  });
}
