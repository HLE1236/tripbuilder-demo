import { apiClient } from '../client';
import type { ForgotPasswordResponse } from '../types';

export async function forgotPasswordApi(email: string): Promise<ForgotPasswordResponse> {
  const res = await apiClient.post('/api/auth/forgot-password', {
    email: email.trim(),
  });
  return res.data.data ?? { message: res.data.message };
}
