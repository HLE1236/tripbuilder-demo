import { apiClient } from '../client';

export async function deleteAdminUserApi(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/users/${id}`);
}
