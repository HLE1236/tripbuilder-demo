import { apiClient } from '../client';
import type { AuthResponse } from '../types';

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export type AuthSessionResponse = AuthResponse;

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/login', {
    email: payload.email.trim(),
    password: payload.password,
    rememberMe: Boolean(payload.rememberMe),
    expectedRole: 'CUSTOMER',
  });
  return res.data.data;
}

export async function authLogin(
  email: string,
  password: string,
  rememberMe = false
): Promise<AuthResponse> {
  return loginApi({ email, password, rememberMe });
}
