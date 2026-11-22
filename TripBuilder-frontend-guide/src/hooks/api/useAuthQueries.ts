import { useMutation, useQuery } from '@tanstack/react-query';
import { getDemoAccountsApi, getMeApi, loginApi } from '@/api/auth';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  demoAccounts: () => [...authKeys.all, 'demo-accounts'] as const,
};

export function useDemoAccountsQuery() {
  return useQuery({
    queryKey: authKeys.demoAccounts(),
    queryFn: getDemoAccountsApi,
    staleTime: 5 * 60_000,
  });
}

export function useMeQuery(enabled: boolean) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    enabled,
    retry: false,
  });
}

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginApi(email, password),
  });
}
