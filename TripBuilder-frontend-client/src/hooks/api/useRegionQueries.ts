import { useQuery } from '@tanstack/react-query';
import { getAllRegionPhotosApi, getRegionPhotosApi, getRegionsApi } from '../../api/region';

export const regionKeys = {
  all: ['regions'] as const,
  list: () => [...regionKeys.all, 'list'] as const,
  photos: (regionId: number, category?: string) =>
    [...regionKeys.all, 'photos', regionId, category ?? 'ALL'] as const,
  allPhotos: (category?: string) =>
    [...regionKeys.all, 'all-photos', category ?? 'ALL'] as const,
};

export function useRegionsQuery(enabled = true) {
  return useQuery({
    queryKey: regionKeys.list(),
    queryFn: getRegionsApi,
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function useRegionPhotosQuery(
  regionId: number | null | undefined,
  category?: string,
  enabled = true
) {
  return useQuery({
    queryKey: regionKeys.photos(regionId ?? 0, category),
    queryFn: () => getRegionPhotosApi(regionId as number, category),
    enabled: enabled && Boolean(regionId),
    staleTime: 5 * 60_000,
  });
}

export function useAllRegionPhotosQuery(category?: string, enabled = true) {
  return useQuery({
    queryKey: regionKeys.allPhotos(category),
    queryFn: () => getAllRegionPhotosApi(category),
    enabled,
    staleTime: 5 * 60_000,
  });
}
