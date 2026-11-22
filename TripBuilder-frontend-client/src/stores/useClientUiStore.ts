import { create } from 'zustand';
import type { PhotoItem } from '../api/types';

export type PageTab = 'explore' | 'saved' | 'trips';
export type DurationFilter = 'ALL' | '2' | '3+';
export type PriceSort = 'default' | 'price_asc' | 'price_desc';

function readInitialBookingCode(): string | null {
  if (typeof window === 'undefined') return null;
  const code = new URLSearchParams(window.location.search).get('bookingCode')?.trim();
  return code || null;
}

interface LightboxState {
  isOpen: boolean;
  photos: PhotoItem[];
  index: number;
  title: string;
}

interface ClientUiState {
  tab: PageTab;
  regionFilter: number | 'ALL';
  durationFilter: DurationFilter;
  priceSort: PriceSort;
  searchQuery: string;

  selectedTourId: number | null;
  selectedBookingId: number | null;
  customizeTourId: number | null;
  pendingBookingCode: string | null;

  cardPhotoIdx: Record<number, number>;
  lightbox: LightboxState;
  flashError: string;

  setTab: (tab: PageTab) => void;
  navigateTab: (tab: PageTab) => void;
  setRegionFilter: (regionId: number | 'ALL') => void;
  setDurationFilter: (duration: DurationFilter) => void;
  setPriceSort: (sort: PriceSort) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;

  setSelectedTourId: (tourId: number | null) => void;
  setSelectedBookingId: (bookingId: number | null) => void;
  setCustomizeTourId: (tourId: number | null) => void;
  setPendingBookingCode: (code: string | null) => void;

  stepCardPhoto: (tourId: number, total: number, delta: number) => void;
  openLightbox: (photos: PhotoItem[], index: number, title: string) => void;
  closeLightbox: () => void;

  setFlashError: (message: string) => void;
  clearFlashError: () => void;
  resetOnLogout: () => void;
}

const initialPendingCode = readInitialBookingCode();

export const useClientUiStore = create<ClientUiState>((set) => ({
  tab: initialPendingCode ? 'trips' : 'explore',
  regionFilter: 'ALL',
  durationFilter: 'ALL',
  priceSort: 'default',
  searchQuery: '',

  selectedTourId: null,
  selectedBookingId: null,
  customizeTourId: null,
  pendingBookingCode: initialPendingCode,

  cardPhotoIdx: {},
  lightbox: {
    isOpen: false,
    photos: [],
    index: 0,
    title: '',
  },
  flashError: '',

  setTab: (tab) => set({ tab }),
  navigateTab: (tab) =>
    set({
      tab,
      selectedBookingId: null,
      selectedTourId: null,
    }),
  setRegionFilter: (regionFilter) => set({ regionFilter }),
  setDurationFilter: (durationFilter) => set({ durationFilter }),
  setPriceSort: (priceSort) => set({ priceSort }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  resetFilters: () =>
    set({
      regionFilter: 'ALL',
      durationFilter: 'ALL',
      priceSort: 'default',
      searchQuery: '',
    }),

  setSelectedTourId: (selectedTourId) => set({ selectedTourId }),
  setSelectedBookingId: (selectedBookingId) => set({ selectedBookingId }),
  setCustomizeTourId: (customizeTourId) => set({ customizeTourId }),
  setPendingBookingCode: (pendingBookingCode) => set({ pendingBookingCode }),

  stepCardPhoto: (tourId, total, delta) => {
    if (total <= 1) return;
    set((state) => {
      const curr = state.cardPhotoIdx[tourId] ?? 0;
      return {
        cardPhotoIdx: {
          ...state.cardPhotoIdx,
          [tourId]: (curr + delta + total) % total,
        },
      };
    });
  },

  openLightbox: (photos, index, title) => {
    if (photos.length === 0) return;
    set({
      lightbox: {
        isOpen: true,
        photos,
        index,
        title,
      },
    });
  },
  closeLightbox: () =>
    set((state) => ({
      lightbox: { ...state.lightbox, isOpen: false },
    })),

  setFlashError: (flashError) => set({ flashError }),
  clearFlashError: () => set({ flashError: '' }),
  resetOnLogout: () =>
    set({
      selectedBookingId: null,
      selectedTourId: null,
      customizeTourId: null,
      pendingBookingCode: null,
      flashError: '',
    }),
}));
