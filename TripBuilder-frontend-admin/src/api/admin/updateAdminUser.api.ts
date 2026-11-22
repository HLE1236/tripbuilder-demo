import { apiClient } from '../client';
import type { UpdateAdminUserPayload, User } from '../types';

export async function updateAdminUserApi(
  id: number,
  payload: UpdateAdminUserPayload
): Promise<User> {
  const res = await apiClient.put(`/api/admin/users/${id}`, payload);
  return res.data.data;
}
