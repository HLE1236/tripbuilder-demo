import { apiClient } from '../client';
import type { ChangePasswordPayload } from '../types';

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put('/api/auth/change-password', {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
  });
}
