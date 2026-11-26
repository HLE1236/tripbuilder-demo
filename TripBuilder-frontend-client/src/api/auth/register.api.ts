import { apiClient } from '../client';
import type { AuthResponse, RegisterPayload } from '../types';

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/register', {
    fullName: payload.fullName.trim(),
    email: payload.email.trim(),
    phone: payload.phone.trim(),
    password: payload.password,
    confirmPassword: payload.confirmPassword,
    acceptedTerms: payload.acceptedTerms,
  });
  return res.data.data;
}

export const authRegister = registerApi;
