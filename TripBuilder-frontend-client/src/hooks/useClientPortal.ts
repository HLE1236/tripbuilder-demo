import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMeApi, loginApi } from '../api/auth';
import { getBookingByIdApi } from '../api/booking';
import { setUnauthorizedHandler } from '../api/interceptor';
import type { Booking, PhotoItem, Tour, User } from '../api/types';
import { getAuthToken } from '../config/storage/auth-storage';
import { useAuthStore } from '../stores/useAuthStore';
import { useClientUiStore } from '../stores/useClientUiStore';
import { useThemeStore } from '../stores/useThemeStore';
import { tourToPhotoItems } from '../utils/tour';
import {
  bookingKeys,
  useBookingsQuery,
  useFavoritesQuery,
  useRegionPhotosQuery,
  useRegionsQuery,
  useToggleFavoriteMutation,
  useToursQuery,
} from './api';

export function useClientPortal() {
  const queryClient = useQueryClient();

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const clearSession = useAuthStore((s) => s.clearSession);

  const tab = useClientUiStore((s) => s.tab);
  const setTab = useClientUiStore((s) => s.setTab);
  const navigateTab = useClientUiStore((s) => s.navigateTab);
  const regionFilter = useClientUiStore((s) => s.regionFilter);
  const setRegionFilter = useClientUiStore((s) => s.setRegionFilter);
  const durationFilter = useClientUiStore((s) => s.durationFilter);
  const setDurationFilter = useClientUiStore((s) => s.setDurationFilter);
  const priceSort = useClientUiStore((s) => s.priceSort);
  const setPriceSort = useClientUiStore((s) => s.setPriceSort);
  const searchQuery = useClientUiStore((s) => s.searchQuery);
  const setSearchQuery = useClientUiStore((s) => s.setSearchQuery);
  const resetFilters = useClientUiStore((s) => s.resetFilters);

  const selectedTourId = useClientUiStore((s) => s.selectedTourId);
  const setSelectedTourId = useClientUiStore((s) => s.setSelectedTourId);
  const selectedBookingId = useClientUiStore((s) => s.selectedBookingId);
  const setSelectedBookingId = useClientUiStore((s) => s.setSelectedBookingId);
  const customizeTourId = useClientUiStore((s) => s.customizeTourId);
  const setCustomizeTourId = useClientUiStore((s) => s.setCustomizeTourId);
  const pendingBookingCode = useClientUiStore((s) => s.pendingBookingCode);
  const setPendingBookingCode = useClientUiStore((s) => s.setPendingBookingCode);

  const cardPhotoIdx = useClientUiStore((s) => s.cardPhotoIdx);
  const stepCardPhoto = useClientUiStore((s) => s.stepCardPhoto);
  const lightbox = useClientUiStore((s) => s.lightbox);
  const openLightbox = useClientUiStore((s) => s.openLightbox);
  const closeLightbox = useClientUiStore((s) => s.closeLightbox);

  const flashError = useClientUiStore((s) => s.flashError);
  const setFlashError = useClientUiStore((s) => s.setFlashError);
  const resetOnLogout = useClientUiStore((s) => s.resetOnLogout);

  const [refreshingBookingId, setRefreshingBookingId] = useState<number | null>(null);

  const initialDemoEmailRef = useRef<string | null>(null);
  if (initialDemoEmailRef.current === null && typeof window !== 'undefined') {
    initialDemoEmailRef.current =
      new URLSearchParams(window.location.search).get('demoEmail')?.trim() || '';
  }

  const handleLogout = useCallback(() => {
    clearSession();
    resetOnLogout();
    queryClient.clear();
  }, [clearSession, resetOnLogout, queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  useEffect(() => {
    let active = true;
    const demoEmail = initialDemoEmailRef.current || '';

    const clearQueryParams = () => {
      if (window.location.search) {
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', cleanUrl);
      }
    };

    const restoreSession = async () => {
      if (demoEmail) {
        try {
          const res = await loginApi({ email: demoEmail, password: '123456' });
          if (!active) return;
          setSession(res.token, res.user);
          clearQueryParams();
          return;
        } catch {
          // Fall back to existing token check
        }
      }

      clearQueryParams();
      const token = getAuthToken();
      if (!token) {
        if (active) setAuthLoading(false);
        return;
      }

      try {
        const me = await getMeApi();
        if (!active) return;
        if (me.role !== 'CUSTOMER') {
          handleLogout();
        } else {
          setUser(me);
        }
      } catch {
        if (active) handleLogout();
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, [handleLogout, setAuthLoading, setSession, setUser]);

  const isAuthenticated = Boolean(user);

  const regionsQuery = useRegionsQuery(isAuthenticated);
  const toursQuery = useToursQuery(undefined, isAuthenticated);
  const bookingsQuery = useBookingsQuery(isAuthenticated);
  const favoritesQuery = useFavoritesQuery(isAuthenticated);

  const regions = regionsQuery.data ?? [];
  const tours = toursQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const favoriteIds = favoritesQuery.data ?? [];

  const loadingData =
    regionsQuery.isLoading || toursQuery.isLoading || bookingsQuery.isLoading;

  const queryError =
    regionsQuery.error?.message ||
    toursQuery.error?.message ||
    bookingsQuery.error?.message ||
    '';

  const error = flashError || queryError;

  // Handle deep-linked ?bookingCode= once bookings load
  useEffect(() => {
    if (!pendingBookingCode || bookings.length === 0) return;
    const matched = bookings.find(
      (b) => b.code.toUpperCase() === pendingBookingCode.toUpperCase()
    );
    if (matched) {
      setSelectedBookingId(matched.id);
      setTab('trips');
    }
    setPendingBookingCode(null);
  }, [bookings, pendingBookingCode, setPendingBookingCode, setSelectedBookingId, setTab]);

  const selectedRegion = useMemo(
    () => (regionFilter === 'ALL' ? null : regions.find((r) => r.id === regionFilter) ?? null),
    [regions, regionFilter]
  );

  const regionPhotosQuery = useRegionPhotosQuery(
    selectedRegion?.id,
    undefined,
    isAuthenticated && Boolean(selectedRegion)
  );

  const selectedRegionPhotos = useMemo(() => {
    if (!selectedRegion) return [] as PhotoItem[];
    return regionPhotosQuery.data || selectedRegion.previewPhotos || [];
  }, [selectedRegion, regionPhotosQuery.data]);

  const detailTour = useMemo(
    () => (selectedTourId ? tours.find((t) => t.id === selectedTourId) ?? null : null),
    [tours, selectedTourId]
  );

  const customizeTour = useMemo(
    () => (customizeTourId ? tours.find((t) => t.id === customizeTourId) ?? null : null),
    [tours, customizeTourId]
  );

  const selectedBooking = useMemo(
    () => (selectedBookingId ? bookings.find((b) => b.id === selectedBookingId) ?? null : null),
    [bookings, selectedBookingId]
  );

  const filteredTours = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = tours.filter((t) => {
      if (regionFilter !== 'ALL' && t.regionId !== regionFilter) return false;
      if (durationFilter === '2' && t.days !== 2) return false;
      if (durationFilter === '3+' && t.days < 3) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.regionName.toLowerCase().includes(q) ||
        t.province.toLowerCase().includes(q) ||
        t.guide.fullName.toLowerCase().includes(q)
      );
    });

    if (priceSort === 'price_asc') {
      return [...list].sort((a, b) => a.basePricePerPerson - b.basePricePerPerson);
    }
    if (priceSort === 'price_desc') {
      return [...list].sort((a, b) => b.basePricePerPerson - a.basePricePerPerson);
    }
    return list;
  }, [tours, regionFilter, durationFilter, priceSort, searchQuery]);

  const savedTours = useMemo(
    () => tours.filter((t) => favoriteIds.includes(t.id)),
    [tours, favoriteIds]
  );

  const toggleFavoriteMutation = useToggleFavoriteMutation();

  const toggleFavorite = async (tourId: number) => {
    const isCurrentlySaved = favoriteIds.includes(tourId);
    setFlashError('');
    try {
      await toggleFavoriteMutation.mutateAsync({ tourId, isCurrentlySaved });
    } catch (e) {
      setFlashError(e instanceof Error ? e.message : 'Không thể cập nhật mục đã lưu');
    }
  };

  const openTourLightbox = (tour: Tour, index = 0) => {
    openLightbox(tourToPhotoItems(tour), index, `${tour.regionName} · ${tour.title}`);
  };

  const handleRefreshBooking = async (bookingId: number) => {
    setRefreshingBookingId(bookingId);
    setFlashError('');
    try {
      const fresh = await queryClient.fetchQuery({
        queryKey: bookingKeys.detail(bookingId),
        queryFn: () => getBookingByIdApi(bookingId),
        staleTime: 0,
      });
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === fresh.id ? fresh : b)) : [fresh]
      );
    } catch (e) {
      setFlashError(e instanceof Error ? e.message : 'Không thể làm mới trạng thái đơn');
    } finally {
      setRefreshingBookingId(null);
    }
  };

  const handleBookingUpdated = (updated: Booking) => {
    queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) => {
      if (!prev) return [updated];
      const exists = prev.some((b) => b.id === updated.id);
      return exists
        ? prev.map((b) => (b.id === updated.id ? updated : b))
        : [updated, ...prev];
    });
    setSelectedBookingId(updated.id);
  };

  const handleBookingCreated = (created: Booking) => {
    setCustomizeTourId(null);
    setSelectedTourId(null);
    handleBookingUpdated(created);
    setTab('trips');
  };

  const handleLoginSuccess = (token: string, loggedInUser: User) => {
    setSession(token, loggedInUser);
  };

  const scrollToCatalog = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const pendingActionCount = bookings.filter((b) => b.status === 'REQUOTED').length;
  const hasActiveFilters =
    regionFilter !== 'ALL' ||
    durationFilter !== 'ALL' ||
    priceSort !== 'default' ||
    searchQuery.trim().length > 0;

  const featuredHeroTour = tours[0] ?? null;
  const heroPreviewPhotos = featuredHeroTour ? tourToPhotoItems(featuredHeroTour) : [];
  const heroSteps = featuredHeroTour ? featuredHeroTour.steps.slice(0, 3) : [];

  return {
    theme,
    toggleTheme,
    user,
    authLoading,
    handleLoginSuccess,
    handleLogout,

    tab,
    setTab,
    navigateTab,
    regionFilter,
    setRegionFilter,
    durationFilter,
    setDurationFilter,
    priceSort,
    setPriceSort,
    searchQuery,
    setSearchQuery,
    resetFilters,

    regions,
    tours,
    bookings,
    favoriteIds,
    filteredTours,
    savedTours,
    selectedRegion,
    selectedRegionPhotos,
    detailTour,
    setSelectedTourId,
    customizeTour,
    setCustomizeTourId,
    selectedBooking,
    setSelectedBookingId,

    cardPhotoIdx,
    stepCardPhoto,
    lightbox,
    openLightbox,
    openTourLightbox,
    closeLightbox,

    loadingData,
    error,
    refreshingBookingId,
    pendingActionCount,
    hasActiveFilters,
    featuredHeroTour,
    heroPreviewPhotos,
    heroSteps,

    toggleFavorite,
    handleRefreshBooking,
    handleBookingUpdated,
    handleBookingCreated,
    scrollToCatalog,
  };
}
