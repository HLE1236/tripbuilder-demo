import { apiClient } from '../client';

export async function deleteAdminTourApi(id: number): Promise<void> {
  await apiClient.delete(`/api/tours/${id}`);
}
