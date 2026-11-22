import { useQuery } from '@tanstack/react-query';
import { getOptionsByRegionApi } from '../../api/option';

export const optionKeys = {
  all: ['options'] as const,
  byRegion: (regionId: number) => [...optionKeys.all, 'region', regionId] as const,
};

export function useOptionsByRegionQuery(regionId: number | null | undefined, enabled = true) {
  return useQuery({
    queryKey: optionKeys.byRegion(regionId ?? 0),
    queryFn: () => getOptionsByRegionApi(regionId as number),
    enabled: enabled && Boolean(regionId),
    staleTime: 5 * 60_000,
  });
}
