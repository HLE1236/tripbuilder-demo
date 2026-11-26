import { apiClient } from '../client';
import type { ResetPasswordPayload } from '../types';

export async function resetPasswordApi(payload: ResetPasswordPayload): Promise<void> {
  await apiClient.post('/api/auth/reset-password', {
    email: payload.email.trim(),
    otp: payload.otp.trim(),
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
  });
}
