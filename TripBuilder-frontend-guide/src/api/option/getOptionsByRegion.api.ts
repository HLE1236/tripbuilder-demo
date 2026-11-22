import { apiClient } from '@/api/client';
import type { PresetOption } from '@/api/types';

export async function getOptionsByRegionApi(regionId: number): Promise<PresetOption[]> {
  const res = await apiClient.get(`/api/options?regionId=${regionId}`);
  return res.data.data;
}
