import { create } from 'zustand';
import type { BookingStatus, UserRole } from '../api/types';

export type AdminTab = 'overview' | 'users' | 'operations' | 'catalog';
export type UsersSubTab = 'USERS' | 'APPLICATIONS';
export type OperationsSubTab = 'BOOKINGS' | 'TOURS';
export type RoleFilter = 'ALL' | UserRole;
export type BookingStatusFilter = 'ALL' | BookingStatus;

interface AdminUiState {
  activeTab: AdminTab;
  usersSubTab: UsersSubTab;
  operationsSubTab: OperationsSubTab;
  bookingStatusFilter: BookingStatusFilter;
  roleFilter: RoleFilter;
  selectedRegionId: number | 'ALL';
  setActiveTab: (tab: AdminTab) => void;
  setUsersSubTab: (subTab: UsersSubTab) => void;
  setOperationsSubTab: (subTab: OperationsSubTab) => void;
  setBookingStatusFilter: (status: BookingStatusFilter) => void;
  setRoleFilter: (role: RoleFilter) => void;
  setSelectedRegionId: (regionId: number | 'ALL') => void;
  resetUiState: () => void;
}

const INITIAL_UI_STATE = {
  activeTab: 'overview' as AdminTab,
  usersSubTab: 'USERS' as UsersSubTab,
  operationsSubTab: 'BOOKINGS' as OperationsSubTab,
  bookingStatusFilter: 'ALL' as BookingStatusFilter,
  roleFilter: 'ALL' as RoleFilter,
  selectedRegionId: 'ALL' as number | 'ALL',
};

export const useAdminUiStore = create<AdminUiState>((set) => ({
  ...INITIAL_UI_STATE,
  setActiveTab: (activeTab) => set({ activeTab }),
  setUsersSubTab: (usersSubTab) => set({ usersSubTab }),
  setOperationsSubTab: (operationsSubTab) => set({ operationsSubTab }),
  setBookingStatusFilter: (bookingStatusFilter) => set({ bookingStatusFilter }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setSelectedRegionId: (selectedRegionId) => set({ selectedRegionId }),
  resetUiState: () => set(INITIAL_UI_STATE),
}));
