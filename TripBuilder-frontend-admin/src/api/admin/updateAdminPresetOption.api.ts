import { apiClient } from '../client';
import type { CreatePresetOptionPayload, PresetOption } from '../types';

export async function updateAdminPresetOptionApi(
  id: number,
  payload: CreatePresetOptionPayload
): Promise<PresetOption> {
  const res = await apiClient.put(`/api/admin/preset-options/${id}`, payload);
  return res.data.data;
}
