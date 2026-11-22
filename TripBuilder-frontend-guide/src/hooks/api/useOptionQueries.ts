import { useQuery } from '@tanstack/react-query';
import { getOptionsByRegionApi } from '@/api/option';

export const optionKeys = {
  all: ['options'] as const,
  byRegion: (regionId: number) => [...optionKeys.all, 'region', regionId] as const,
};

export function useOptionsByRegionQuery(regionId: number) {
  return useQuery({
    queryKey: optionKeys.byRegion(regionId),
    queryFn: () => getOptionsByRegionApi(regionId),
    enabled: Boolean(regionId),
    staleTime: 5 * 60_000,
  });
}
