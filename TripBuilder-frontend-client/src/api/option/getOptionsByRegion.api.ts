import { apiClient } from '../client';
import type { PresetOption } from '../types';

export type OptionSort = 'default' | 'price_asc' | 'price_desc';

export interface GetOptionsByRegionParams {
  regionId: number;
  category?: string;
  q?: string;
  sort?: OptionSort;
}

export async function getOptionsByRegionApi(
  regionIdOrParams: number | GetOptionsByRegionParams
): Promise<PresetOption[]> {
  const params: Record<string, string | number> =
    typeof regionIdOrParams === 'number'
      ? { regionId: regionIdOrParams }
      : {
          regionId: regionIdOrParams.regionId,
          ...(regionIdOrParams.category ? { category: regionIdOrParams.category } : {}),
          ...(regionIdOrParams.q?.trim() ? { q: regionIdOrParams.q.trim() } : {}),
          ...(regionIdOrParams.sort && regionIdOrParams.sort !== 'default'
            ? { sort: regionIdOrParams.sort }
            : {}),
        };

  const res = await apiClient.get('/api/options', { params });
  return res.data.data;
}

export const getOptionsByRegion = getOptionsByRegionApi;
export const getPresetOptions = getOptionsByRegionApi;
