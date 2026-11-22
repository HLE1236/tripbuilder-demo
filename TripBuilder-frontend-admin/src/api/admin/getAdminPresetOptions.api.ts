import { apiClient } from '../client';
import type { PresetOption } from '../types';

export async function getAdminPresetOptionsApi(): Promise<PresetOption[]> {
  const res = await apiClient.get('/api/admin/preset-options');
  return res.data.data;
}
