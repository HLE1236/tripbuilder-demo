import { apiClient } from '../client';
import type { CreateAdminUserPayload, User } from '../types';

export async function createAdminUserApi(payload: CreateAdminUserPayload): Promise<User> {
  const res = await apiClient.post('/api/admin/users', payload);
  return res.data.data;
}
