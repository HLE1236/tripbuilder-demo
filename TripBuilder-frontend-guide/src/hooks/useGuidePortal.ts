import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getMeApi, loginApi, setUnauthorizedHandler, type Booking, type Tour } from '@/api';
import { statusMeta } from '@/config/constants/meta';
import { getAuthToken } from '@/config/storage/auth-storage';
import {
  bookingKeys,
  tourKeys,
  useBookingsQuery,
  useRegionsQuery,
  useToursQuery,
} from '@/hooks/api';
import { useAuthStore, useGuideUiStore, useThemeStore } from '@/stores';

export function useGuidePortal() {
  const queryClient = useQueryClient();

  const { mode, toggleMode } = useThemeStore();
  const {
    user,
    authChecking,
    authError,
    setUser,
    setSession,
    setAuthChecking,
    setAuthError,
    logout,
  } = useAuthStore();

  const {
    section,
    ledgerFilter,
    bookingFilter,
    searchQuery,
    selectedBookingId,
    drawerBookingId,
    editorOpen,
    editingTour,
    setSection,
    setLedgerFilter,
    setBookingFilter,
    setSearchQuery,
    openBookingWorkspace,
    closeBookingWorkspace,
    openBookingDrawer,
    closeBookingDrawer,
    openTourEditor,
    closeTourEditor,
    resetSessionUi,
  } = useGuideUiStore();

  const [initialParams] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      demoEmail: params.get('demoEmail')?.trim() || '',
      bookingCode: params.get('bookingCode')?.trim() || '',
    };
  });

  const pendingBookingCodeRef = useRef<string | null>(
    initialParams.bookingCode || null
  );

  const handleLogout = useCallback(() => {
    logout();
    resetSessionUi();
    queryClient.removeQueries({ queryKey: bookingKeys.all });
    queryClient.removeQueries({ queryKey: tourKeys.all });
  }, [logout, resetSessionUi, queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(handleLogout);
    return () => setUnauthorizedHandler(null);
  }, [handleLogout]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => {
    let active = true;
    const demoEmail = initialParams.demoEmail;

    const clearQueryParams = () => {
      if (window.location.search) {
        window.history.replaceState({}, '', window.location.pathname + window.location.hash);
      }
    };

    if (demoEmail) {
      setAuthChecking(true);
      loginApi(demoEmail, '123456')
        .then((res) => {
          if (!active) return;
          setSession(res.token, res.user);
          resetSessionUi();
          clearQueryParams();
        })
        .catch((err) => {
          if (!active) return;
          setAuthError(
            err instanceof Error ? err.message : 'Không thể chuyển nhanh tài khoản Guide'
          );
          handleLogout();
          clearQueryParams();
        })
        .finally(() => {
          if (active) setAuthChecking(false);
        });
      return () => {
        active = false;
      };
    }

    clearQueryParams();
    const token = getAuthToken();
    if (!token) {
      setAuthChecking(false);
      return;
    }

    setAuthChecking(true);
    getMeApi()
      .then((u) => {
        if (!active) return;
        if (u.role !== 'GUIDE') {
          handleLogout();
          return;
        }
        setUser(u);
      })
      .catch(() => {
        if (active) handleLogout();
      })
      .finally(() => {
        if (active) setAuthChecking(false);
      });

    return () => {
      active = false;
    };
  }, [
    handleLogout,
    initialParams.demoEmail,
    resetSessionUi,
    setAuthChecking,
    setAuthError,
    setSession,
    setUser,
  ]);

  const isAuthenticated = Boolean(user);
  const regionsQuery = useRegionsQuery(isAuthenticated);
  const toursQuery = useToursQuery(user?.id, isAuthenticated);
  const bookingsQuery = useBookingsQuery(isAuthenticated);

  const regions = regionsQuery.data ?? [];
  const tours = toursQuery.data ?? [];
  const bookings = bookingsQuery.data ?? [];

  useEffect(() => {
    if (!pendingBookingCodeRef.current || bookings.length === 0) return;
    const targetCode = pendingBookingCodeRef.current.toUpperCase();
    pendingBookingCodeRef.current = null;
    const found = bookings.find((b) => b.code.toUpperCase() === targetCode);
    if (found) {
      openBookingWorkspace(found.id);
    }
  }, [bookings, openBookingWorkspace]);

  const loading =
    regionsQuery.isFetching || toursQuery.isFetching || bookingsQuery.isFetching;

  const queryError =
    regionsQuery.error || toursQuery.error || bookingsQuery.error;
  const error =
    authError ||
    (queryError instanceof Error
      ? queryError.message
      : queryError
      ? 'Không tải được dữ liệu điều phối'
      : '');

  const loadData = useCallback(async () => {
    if (!user) return;
    setAuthError('');
    await Promise.all([
      regionsQuery.refetch(),
      toursQuery.refetch(),
      bookingsQuery.refetch(),
    ]);
  }, [user, setAuthError, regionsQuery, toursQuery, bookingsQuery]);

  const selectedBooking = useMemo(
    () =>
      selectedBookingId != null
        ? bookings.find((b) => b.id === selectedBookingId) ?? null
        : null,
    [bookings, selectedBookingId]
  );

  const drawerBooking = useMemo(
    () =>
      drawerBookingId != null
        ? bookings.find((b) => b.id === drawerBookingId) ?? null
        : null,
    [bookings, drawerBookingId]
  );

  const actionQueue = useMemo(
    () => bookings.filter((b) => statusMeta(b.status).actionNeeded),
    [bookings]
  );

  const requotedList = useMemo(
    () => bookings.filter((b) => b.status === 'REQUOTED'),
    [bookings]
  );

  const confirmedList = useMemo(
    () => bookings.filter((b) => b.status === 'CONFIRMED'),
    [bookings]
  );

  const cancelledList = useMemo(
    () => bookings.filter((b) => b.status === 'CANCELLED'),
    [bookings]
  );

  const confirmedRevenue = useMemo(
    () => confirmedList.reduce((acc, b) => acc + (b.totalPrice || 0), 0),
    [confirmedList]
  );

  const ledgerFilteredBookings = useMemo(() => {
    if (ledgerFilter === 'ALL') return bookings;
    if (ledgerFilter === 'ACTION') return actionQueue;
    if (ledgerFilter === 'REQUOTED') return requotedList;
    return confirmedList;
  }, [ledgerFilter, bookings, actionQueue, requotedList, confirmedList]);

  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      if (bookingFilter === 'ACTION' && !statusMeta(b.status).actionNeeded) return false;
      if (bookingFilter === 'REQUOTED' && b.status !== 'REQUOTED') return false;
      if (bookingFilter === 'CONFIRMED' && b.status !== 'CONFIRMED') return false;
      if (bookingFilter === 'CANCELLED' && b.status !== 'CANCELLED') return false;
      if (!q) return true;
      return (
        b.code.toLowerCase().includes(q) ||
        b.customer.fullName.toLowerCase().includes(q) ||
        b.tourTitleSnapshot.toLowerCase().includes(q)
      );
    });
  }, [bookings, bookingFilter, searchQuery]);

  const updateBookingInList = useCallback(
    (updated: Booking) => {
      queryClient.setQueryData<Booking[]>(bookingKeys.list(), (prev) =>
        prev ? prev.map((b) => (b.id === updated.id ? updated : b)) : [updated]
      );
    },
    [queryClient]
  );

  const handleTourSaved = useCallback(
    (saved: Tour, isNew: boolean) => {
      closeTourEditor();
      queryClient.setQueryData<Tour[]>(tourKeys.list(user?.id), (prev) => {
        if (!prev) return [saved];
        return isNew ? [saved, ...prev] : prev.map((t) => (t.id === saved.id ? saved : t));
      });
    },
    [closeTourEditor, queryClient, user?.id]
  );

  const ledgerTitle =
    ledgerFilter === 'ALL'
      ? `Tất cả hồ sơ đặt tour (${bookings.length})`
      : ledgerFilter === 'ACTION'
      ? `Hồ sơ cần báo giá ngay (${actionQueue.length})`
      : ledgerFilter === 'REQUOTED'
      ? `Đơn đã gửi báo giá — chờ khách phản hồi (${requotedList.length})`
      : `Chuyến đã chốt thành công (${confirmedList.length})`;

  return {
    mode,
    toggleMode,
    user,
    authChecking,
    setSession,
    handleLogout,
    section,
    setSection,
    ledgerFilter,
    setLedgerFilter,
    bookingFilter,
    setBookingFilter,
    searchQuery,
    setSearchQuery,
    regions,
    tours,
    bookings,
    selectedBooking,
    drawerBooking,
    openBookingWorkspace,
    closeBookingWorkspace,
    openBookingDrawer,
    closeBookingDrawer,
    editorOpen,
    editingTour,
    openTourEditor,
    closeTourEditor,
    handleTourSaved,
    loading,
    error,
    loadData,
    actionQueue,
    requotedList,
    confirmedList,
    cancelledList,
    confirmedRevenue,
    ledgerFilteredBookings,
    filteredBookings,
    ledgerTitle,
    updateBookingInList,
  };
}
