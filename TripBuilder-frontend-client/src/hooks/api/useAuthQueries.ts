import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getDemoAccountsApi,
  getMeApi,
  loginApi,
  registerApi,
  type LoginPayload,
  type RegisterPayload,
} from '../../api/auth';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
  demoAccounts: () => [...authKeys.all, 'demo-accounts'] as const,
};

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    enabled,
    retry: false,
  });
}

export function useDemoAccountsQuery() {
  return useQuery({
    queryKey: authKeys.demoAccounts(),
    queryFn: getDemoAccountsApi,
    staleTime: 5 * 60_000,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LoginPayload) => loginApi(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => registerApi(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me(), data.user);
    },
  });
}
