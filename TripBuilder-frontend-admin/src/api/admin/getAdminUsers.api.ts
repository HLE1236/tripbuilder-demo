import { apiClient } from '../client';
import type { User, UserRole } from '../types';

export async function getAdminUsersApi(role?: UserRole | 'ALL'): Promise<User[]> {
  const params = role && role !== 'ALL' ? { role } : undefined;
  const res = await apiClient.get('/api/admin/users', { params });
  return res.data.data;
}
