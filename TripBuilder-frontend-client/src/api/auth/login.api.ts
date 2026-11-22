import { apiClient } from '../client';
import type { User } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSessionResponse {
  token: string;
  user: User;
}

export async function loginApi(payload: LoginPayload): Promise<AuthSessionResponse> {
  const res = await apiClient.post('/api/auth/login', {
    email: payload.email.trim(),
    password: payload.password,
    expectedRole: 'CUSTOMER',
  });
  return res.data.data;
}

export async function authLogin(email: string, password: string): Promise<AuthSessionResponse> {
  return loginApi({ email, password });
}
