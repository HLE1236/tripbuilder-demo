import { apiClient } from '../client';
import type { User, UserRole } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
  expectedRole?: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const res = await apiClient.post('/api/auth/login', {
    email: payload.email,
    password: payload.password,
    expectedRole: payload.expectedRole ?? 'ADMIN',
  });
  return res.data.data;
}
