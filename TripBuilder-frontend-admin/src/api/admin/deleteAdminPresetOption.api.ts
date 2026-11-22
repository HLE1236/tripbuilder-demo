import { apiClient } from '../client';

export async function deleteAdminPresetOptionApi(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/preset-options/${id}`);
}
