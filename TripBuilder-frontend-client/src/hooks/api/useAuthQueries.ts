import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  changePasswordApi,
  forgotPasswordApi,
  getMeApi,
  loginApi,
  logoutApi,
  registerApi,
  resetPasswordApi,
  updateProfileApi,
  type LoginPayload,
} from '../../api/auth';
import type {
  ChangePasswordPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from '../../api/types';

export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
};

export function useMeQuery(enabled = true) {
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: getMeApi,
    enabled,
    retry: false,
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

export function useLogoutMutation() {
  return useMutation({
    mutationFn: (refreshToken?: string | null) => logoutApi(refreshToken),
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (email: string) => forgotPasswordApi(email),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (payload: ResetPasswordPayload) => resetPasswordApi(payload),
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateProfileApi(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(authKeys.me(), user);
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePasswordApi(payload),
  });
}
