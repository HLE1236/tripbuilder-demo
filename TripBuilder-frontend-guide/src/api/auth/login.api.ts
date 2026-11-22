import { apiClient } from '@/api/client';
import type { User } from '@/api/types';

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginApi(
  email: string,
  password: string
): Promise<LoginResponse> {
  const res = await apiClient.post('/api/auth/login', {
    email,
    password,
    expectedRole: 'GUIDE',
  });
  return res.data.data;
}
