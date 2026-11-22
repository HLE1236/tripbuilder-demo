import { apiClient } from '../client';
import type { PresetOption } from '../types';

export async function getOptionsByRegionApi(regionId: number): Promise<PresetOption[]> {
  const res = await apiClient.get('/api/options', {
    params: { regionId },
  });
  return res.data.data;
}

export const getOptionsByRegion = getOptionsByRegionApi;
export const getPresetOptions = getOptionsByRegionApi;
