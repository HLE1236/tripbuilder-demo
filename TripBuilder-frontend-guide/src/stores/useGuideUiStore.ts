import { create } from 'zustand';
import type { Tour } from '@/api/types';

export type NavSectionKey = 'overview' | 'bookings' | 'tours';
export type BookingFilter =
  | 'ALL'
  | 'ACTION'
  | 'REQUOTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';
export type LedgerFilter = 'ALL' | 'ACTION' | 'REQUOTED' | 'CONFIRMED';

interface GuideUiState {
  section: NavSectionKey;
  ledgerFilter: LedgerFilter;
  bookingFilter: BookingFilter;
  searchQuery: string;
  selectedBookingId: number | null;
  drawerBookingId: number | null;
  editorOpen: boolean;
  editingTour: Tour | null;

  setSection: (section: NavSectionKey) => void;
  setLedgerFilter: (filter: LedgerFilter) => void;
  setBookingFilter: (filter: BookingFilter) => void;
  setSearchQuery: (query: string) => void;
  openBookingWorkspace: (bookingId: number) => void;
  closeBookingWorkspace: () => void;
  openBookingDrawer: (bookingId: number) => void;
  closeBookingDrawer: () => void;
  openTourEditor: (tour?: Tour | null) => void;
  closeTourEditor: () => void;
  resetSessionUi: () => void;
}

export const useGuideUiStore = create<GuideUiState>((set) => ({
  section: 'overview',
  ledgerFilter: 'ACTION',
  bookingFilter: 'ALL',
  searchQuery: '',
  selectedBookingId: null,
  drawerBookingId: null,
  editorOpen: false,
  editingTour: null,

  setSection: (section) => set({ section, selectedBookingId: null }),
  setLedgerFilter: (ledgerFilter) => set({ ledgerFilter }),
  setBookingFilter: (bookingFilter) => set({ bookingFilter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  openBookingWorkspace: (bookingId) =>
    set({ selectedBookingId: bookingId, drawerBookingId: null, section: 'bookings' }),
  closeBookingWorkspace: () => set({ selectedBookingId: null }),
  openBookingDrawer: (bookingId) => set({ drawerBookingId: bookingId }),
  closeBookingDrawer: () => set({ drawerBookingId: null }),
  openTourEditor: (tour = null) => set({ editingTour: tour ?? null, editorOpen: true }),
  closeTourEditor: () => set({ editorOpen: false, editingTour: null }),
  resetSessionUi: () =>
    set({
      selectedBookingId: null,
      drawerBookingId: null,
      editorOpen: false,
      editingTour: null,
    }),
}));
