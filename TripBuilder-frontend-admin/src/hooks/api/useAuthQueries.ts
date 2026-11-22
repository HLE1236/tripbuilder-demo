import { useMutation, useQuery } from '@tanstack/react-query';
import {
  getDemoAccountsApi,
  getMeApi,
  loginApi,
  type LoginPayload,
  type UserRole,
} from '../../api';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  demoAccounts: (role: UserRole) => [...authKeys.all, 'demo-accounts', role] as const,
};

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    enabled,
    retry: false,
  });
}

export function useDemoAccountsQuery(role: UserRole = 'ADMIN') {
  return useQuery({
    queryKey: authKeys.demoAccounts(role),
    queryFn: () => getDemoAccountsApi(role),
    staleTime: 5 * 60_000,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
  });
}
