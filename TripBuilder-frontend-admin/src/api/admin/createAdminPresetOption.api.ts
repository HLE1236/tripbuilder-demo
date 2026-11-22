import { apiClient } from '../client';
import type { CreatePresetOptionPayload, PresetOption } from '../types';

export async function createAdminPresetOptionApi(
  payload: CreatePresetOptionPayload
): Promise<PresetOption> {
  const res = await apiClient.post('/api/admin/preset-options', payload);
  return res.data.data;
}
