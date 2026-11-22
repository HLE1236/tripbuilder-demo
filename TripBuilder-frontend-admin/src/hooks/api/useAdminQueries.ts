import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelAdminBookingApi,
  createAdminPresetOptionApi,
  createAdminUserApi,
  deleteAdminPresetOptionApi,
  deleteAdminTourApi,
  deleteAdminUserApi,
  getAdminBookingsApi,
  getAdminOverviewApi,
  getAdminPresetOptionsApi,
  getAdminRegionsApi,
  getAdminToursApi,
  getAdminUsersApi,
  updateAdminPresetOptionApi,
  updateAdminUserApi,
  type CreateAdminUserPayload,
  type CreatePresetOptionPayload,
  type UpdateAdminUserPayload,
  type UserRole,
} from '../../api';

export const adminKeys = {
  all: ['admin'] as const,
  overview: () => [...adminKeys.all, 'overview'] as const,
  users: (role?: UserRole | 'ALL') =>
    role ? ([...adminKeys.all, 'users', role] as const) : ([...adminKeys.all, 'users'] as const),
  tours: () => [...adminKeys.all, 'tours'] as const,
  bookings: () => [...adminKeys.all, 'bookings'] as const,
  regions: () => [...adminKeys.all, 'regions'] as const,
  presetOptions: () => [...adminKeys.all, 'preset-options'] as const,
};

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: adminKeys.overview(),
    queryFn: getAdminOverviewApi,
  });
}

export function useAdminUsersQuery(role: UserRole | 'ALL' = 'ALL') {
  return useQuery({
    queryKey: adminKeys.users(role),
    queryFn: () => getAdminUsersApi(role),
  });
}

export function useCreateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUserApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useAdminToursQuery() {
  return useQuery({
    queryKey: adminKeys.tours(),
    queryFn: getAdminToursApi,
  });
}

export function useAdminBookingsQuery() {
  return useQuery({
    queryKey: adminKeys.bookings(),
    queryFn: getAdminBookingsApi,
  });
}

export function useAdminRegionsQuery() {
  return useQuery({
    queryKey: adminKeys.regions(),
    queryFn: getAdminRegionsApi,
    staleTime: 5 * 60_000,
  });
}

export function useAdminPresetOptionsQuery() {
  return useQuery({
    queryKey: adminKeys.presetOptions(),
    queryFn: getAdminPresetOptionsApi,
  });
}

export function useCreateAdminPresetOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePresetOptionPayload) => createAdminPresetOptionApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.presetOptions() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useDeleteAdminPresetOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminPresetOptionApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.presetOptions() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useUpdateAdminPresetOptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CreatePresetOptionPayload }) =>
      updateAdminPresetOptionApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.presetOptions() });
    },
  });
}

export function useUpdateAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateAdminUserPayload }) =>
      updateAdminUserApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

export function useDeleteAdminUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminUserApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useCancelAdminBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelAdminBookingApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useDeleteAdminTourMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteAdminTourApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.tours() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}
