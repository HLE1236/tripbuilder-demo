import { apiClient } from '../client';
import type { AuthSessionResponse } from './login.api';

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export async function registerApi(payload: RegisterPayload): Promise<AuthSessionResponse> {
  const res = await apiClient.post('/api/auth/register', {
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: payload.phone?.trim() || undefined,
    password: payload.password,
  });
  return res.data.data;
}

export const authRegister = registerApi;
