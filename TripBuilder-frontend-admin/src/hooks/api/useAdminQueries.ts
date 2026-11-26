import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveGuideApplicationApi,
  cancelAdminBookingApi,
  completeBookingApi,
  createAdminPresetOptionApi,
  createAdminUserApi,
  deleteAdminPresetOptionApi,
  deleteAdminTourApi,
  deleteAdminUserApi,
  getAdminBookingsApi,
  getAdminGuideApplicationsApi,
  getAdminOverviewApi,
  getAdminPresetOptionsApi,
  getAdminRegionsApi,
  getAdminToursApi,
  getAdminUsersApi,
  reassignBookingGuideApi,
  rejectGuideApplicationApi,
  toggleTourStatusApi,
  updateAdminPresetOptionApi,
  updateAdminUserApi,
  type ApproveGuideApplicationPayload,
  type CreateAdminUserPayload,
  type CreatePresetOptionPayload,
  type GuideApplicationStatus,
  type RejectGuideApplicationPayload,
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
  guideApplications: (status?: GuideApplicationStatus | 'ALL') =>
    status
      ? ([...adminKeys.all, 'guide-applications', status] as const)
      : ([...adminKeys.all, 'guide-applications'] as const),
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
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      cancelAdminBookingApi(id, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useReassignBookingGuideMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, guideId }: { bookingId: number; guideId: number }) =>
      reassignBookingGuideApi(bookingId, guideId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useCompleteBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => completeBookingApi(bookingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.bookings() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useToggleTourStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tourId, active }: { tourId: number; active: boolean }) =>
      toggleTourStatusApi(tourId, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.tours() });
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

export function useAdminGuideApplicationsQuery(
  status: GuideApplicationStatus | 'ALL' = 'ALL'
) {
  return useQuery({
    queryKey: adminKeys.guideApplications(status),
    queryFn: () => getAdminGuideApplicationsApi(status),
  });
}

export function useApproveGuideApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload?: ApproveGuideApplicationPayload;
    }) => approveGuideApplicationApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.guideApplications() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}

export function useRejectGuideApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: RejectGuideApplicationPayload;
    }) => rejectGuideApplicationApi(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.guideApplications() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.overview() });
    },
  });
}
