import { apiClient } from '../client';
import type { UpdateProfilePayload, User } from '../types';

export async function updateProfileApi(payload: UpdateProfilePayload): Promise<User> {
  const res = await apiClient.put('/api/auth/profile', {
    fullName: payload.fullName.trim(),
    phone: payload.phone?.trim() ?? '',
    avatarUrl: payload.avatarUrl?.trim() || null,
  });
  return res.data.data;
}
