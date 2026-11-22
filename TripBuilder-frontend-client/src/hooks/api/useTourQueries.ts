import { useQuery } from '@tanstack/react-query';
import { getTourByIdApi, getToursApi } from '../../api/tour';
import type { TourFilterParams } from '../../api/types';

export const tourKeys = {
  all: ['tours'] as const,
  list: (params?: TourFilterParams) => [...tourKeys.all, 'list', params ?? {}] as const,
  detail: (id: number) => [...tourKeys.all, 'detail', id] as const,
};

export function useToursQuery(params?: TourFilterParams, enabled = true) {
  return useQuery({
    queryKey: tourKeys.list(params),
    queryFn: () => getToursApi(params),
    enabled,
  });
}

export function useTourDetailQuery(id: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: tourKeys.detail(id ?? 0),
    queryFn: () => getTourByIdApi(id as number),
    enabled: enabled && Boolean(id),
  });
}
