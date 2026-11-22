import { useQuery } from '@tanstack/react-query';
import {
  getAllRegionPhotosApi,
  getRegionPhotosApi,
  getRegionsApi,
} from '@/api/region';

export const regionKeys = {
  all: ['regions'] as const,
  list: () => [...regionKeys.all, 'list'] as const,
  photos: (regionId: number, category?: string) =>
    [...regionKeys.all, 'photos', regionId, category ?? 'all'] as const,
  allPhotos: (category?: string) =>
    [...regionKeys.all, 'all-photos', category ?? 'all'] as const,
};

export function useRegionsQuery(enabled = true) {
  return useQuery({
    queryKey: regionKeys.list(),
    queryFn: getRegionsApi,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useRegionPhotosQuery(regionId: number, category?: string) {
  return useQuery({
    queryKey: regionKeys.photos(regionId, category),
    queryFn: () => getRegionPhotosApi(regionId, category),
    enabled: Boolean(regionId),
    staleTime: 5 * 60_000,
  });
}

export function useAllRegionPhotosQuery(enabled: boolean, category?: string) {
  return useQuery({
    queryKey: regionKeys.allPhotos(category),
    queryFn: () => getAllRegionPhotosApi(category),
    enabled,
    staleTime: 5 * 60_000,
  });
}
