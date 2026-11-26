import { apiClient } from '@/api/client';
import type { AuthResponse } from '@/api/types';

export type LoginResponse = AuthResponse;

export async function loginApi(
  email: string,
  password: string,
  rememberMe = false
): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/login', {
    email,
    password,
    expectedRole: 'GUIDE',
    rememberMe,
  });
  return res.data.data;
}
