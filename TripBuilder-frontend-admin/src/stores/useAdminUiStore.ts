import { create } from 'zustand';
import type { UserRole } from '../api/types';

export type AdminTab = 'overview' | 'users' | 'operations' | 'catalog';
export type OperationsSubTab = 'BOOKINGS' | 'TOURS';
export type RoleFilter = 'ALL' | UserRole;

interface AdminUiState {
  activeTab: AdminTab;
  operationsSubTab: OperationsSubTab;
  roleFilter: RoleFilter;
  selectedRegionId: number | 'ALL';
  setActiveTab: (tab: AdminTab) => void;
  setOperationsSubTab: (subTab: OperationsSubTab) => void;
  setRoleFilter: (role: RoleFilter) => void;
  setSelectedRegionId: (regionId: number | 'ALL') => void;
  resetUiState: () => void;
}

const INITIAL_UI_STATE = {
  activeTab: 'overview' as AdminTab,
  operationsSubTab: 'BOOKINGS' as OperationsSubTab,
  roleFilter: 'ALL' as RoleFilter,
  selectedRegionId: 'ALL' as number | 'ALL',
};

export const useAdminUiStore = create<AdminUiState>((set) => ({
  ...INITIAL_UI_STATE,
  setActiveTab: (activeTab) => set({ activeTab }),
  setOperationsSubTab: (operationsSubTab) => set({ operationsSubTab }),
  setRoleFilter: (roleFilter) => set({ roleFilter }),
  setSelectedRegionId: (selectedRegionId) => set({ selectedRegionId }),
  resetUiState: () => set(INITIAL_UI_STATE),
}));
