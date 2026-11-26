import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMeApi, logoutApi } from '../api/auth';
import { createBookingApi, getBookingByIdApi, type CreateBookingPayload } from '../api/booking';
import { setUnauthorizedHandler } from '../api/interceptor';
import type { AuthResponse, Booking, PhotoItem, Tour } from '../api/types';
import { getAuthToken, getRefreshToken } from '../config/storage/auth-storage';
import { useAuthStore } from '../stores/useAuthStore';
import { useClientUiStore } from '../stores/useClientUiStore';
import { useThemeStore } from '../stores/useThemeStore';
import { matchesVietnameseQuery } from '../utils/search';
import { tourToPhotoItems } from '../utils/tour';
import {
  authKeys,
  bookingKeys,
  favoriteKeys,
  useBookingsQuery,
  useFavoritesQuery,
  useRegionPhotosQuery,
  useRegionsQuery,
  useToggleFavoriteMutation,
  useToursQuery,
} from './api';

export function useClientPortal(onAutoBookingCreated?: (booking: Booking) => void) {
  const queryClient = useQueryClient();

  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.authLoading);
  const setSession = useAuthStore((s) => s.setSession);
  const setUser = useAuthStore((s) => s.setUser);
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);
  const clearSession = useAuthStore((s) => s.clearSession);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);

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
  const [pendingBookingDraft, setPendingBookingDraft] = useState<Omit<
    CreateBookingPayload,
    'customerId'
  > | null>(null);

  const clearLocalSession = useCallback(() => {
    clearSession();
    resetOnLogout();
    queryClient.removeQueries({ queryKey: bookingKeys.all });
    queryClient.removeQueries({ queryKey: favoriteKeys.all });
    queryClient.removeQueries({ queryKey: authKeys.all });
  }, [clearSession, resetOnLogout, queryClient]);

  const handleLogout = useCallback(() => {
    const rt = useAuthStore.getState().refreshToken ?? getRefreshToken();
    if (rt) {
      void logoutApi(rt).catch(() => {});
    }
    clearLocalSession();
  }, [clearLocalSession]);

  useEffect(() => {
    setUnauthorizedHandler(clearLocalSession);
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = getAuthToken();
      const rt = getRefreshToken();
      if (!token && !rt) {
        if (active) setAuthLoading(false);
        return;
      }

      try {
        const me = await getMeApi();
        if (!active) return;
        if (me.role !== 'CUSTOMER') {
          clearLocalSession();
        } else {
          setUser(me);
        }
      } catch {
        if (active) clearLocalSession();
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    void restoreSession();
    return () => {
      active = false;
    };
  }, [clearLocalSession, setAuthLoading, setUser]);

  const isAuthenticated = Boolean(user);

  // Public catalog queries are always enabled so guests can browse & search freely
  const regionsQuery = useRegionsQuery(true);
  const toursQuery = useToursQuery(undefined, true);
  // Private queries are gated on authentication
  const bookingsQuery = useBookingsQuery(isAuthenticated);
  const favoritesQuery = useFavoritesQuery(isAuthenticated);

  const regions = regionsQuery.data ?? [];
  const tours = toursQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];
  const favoriteIds = favoritesQuery.data ?? [];

  const loadingData =
    regionsQuery.isLoading ||
    toursQuery.isLoading ||
    (isAuthenticated && bookingsQuery.isLoading);

  const queryError =
    regionsQuery.error?.message ||
    toursQuery.error?.message ||
    (isAuthenticated ? bookingsQuery.error?.message : '') ||
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
    Boolean(selectedRegion)
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
    const q = searchQuery.trim();
    const list = tours.filter((t) => {
      if (regionFilter !== 'ALL' && t.regionId !== regionFilter) return false;
      if (durationFilter === '2' && t.days !== 2) return false;
      if (durationFilter === '3+' && t.days < 3) return false;
      if (!q) return true;
      return (
        matchesVietnameseQuery(t.title, q) ||
        matchesVietnameseQuery(t.regionName, q) ||
        matchesVietnameseQuery(t.province, q) ||
        matchesVietnameseQuery(t.guide.fullName, q)
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
    if (!user) {
      openAuthModal('login', { type: 'favorite', tourId });
      return;
    }
    const isCurrentlySaved = favoriteIds.includes(tourId);
    setFlashError('');
    try {
      await toggleFavoriteMutation.mutateAsync({ tourId, isCurrentlySaved });
    } catch (e) {
      setFlashError(e instanceof Error ? e.message : 'Không thể cập nhật mục đã lưu');
    }
  };

  const requestCustomize = (tourId: number) => {
    setFlashError('');
    setCustomizeTourId(tourId);
  };

  const requireAuthForBookingSubmit = (draft: Omit<CreateBookingPayload, 'customerId'>) => {
    setFlashError('');
    setPendingBookingDraft(draft);
    openAuthModal('login', { type: 'submit_booking', tourId: draft.tourId });
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

  const handleAuthSuccess = (data: AuthResponse, rememberMe = true) => {
    const pendingIntent = useAuthStore.getState().authModal.pendingIntent;
    setSession(data.token, data.user, data.refreshToken, rememberMe);
    closeAuthModal();

    if (pendingIntent) {
      if (pendingIntent.type === 'submit_booking' && pendingBookingDraft) {
        const draftToSubmit = pendingBookingDraft;
        setPendingBookingDraft(null);
        setFlashError('');
        void createBookingApi({
          ...draftToSubmit,
          customerId: data.user.id,
        })
          .then((created) => {
            handleBookingCreated(created);
            queryClient.invalidateQueries({ queryKey: bookingKeys.list() });
            onAutoBookingCreated?.(created);
          })
          .catch((e) => {
            setFlashError(
              e instanceof Error ? e.message : 'Không thể gửi yêu cầu đặt chuyến sau khi đăng nhập'
            );
          });
      } else if (pendingIntent.type === 'customize') {
        setCustomizeTourId(pendingIntent.tourId);
      } else if (pendingIntent.type === 'favorite') {
        void toggleFavoriteMutation
          .mutateAsync({ tourId: pendingIntent.tourId, isCurrentlySaved: false })
          .catch(() => {});
      }
    }
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
    setUser,
    authLoading,
    handleAuthSuccess,
    handleLogout,
    openAuthModal,

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
    requestCustomize,
    requireAuthForBookingSubmit,
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
    flashError,
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
