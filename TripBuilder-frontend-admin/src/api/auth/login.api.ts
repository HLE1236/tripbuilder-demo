import { apiClient } from '../client';
import type { AuthResponse, UserRole } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
  expectedRole?: UserRole;
  rememberMe?: boolean;
}

export type LoginResponse = AuthResponse;

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/login', {
    email: payload.email,
    password: payload.password,
    expectedRole: payload.expectedRole ?? 'ADMIN',
    rememberMe: payload.rememberMe ?? false,
  });
  return res.data.data;
}
