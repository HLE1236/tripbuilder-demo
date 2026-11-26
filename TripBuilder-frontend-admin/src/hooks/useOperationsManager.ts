import { useMemo, useState } from 'react';
import type { Booking, Tour, User } from '../api';
import { useAdminUiStore } from '../stores';
import {
  useAdminBookingsQuery,
  useAdminToursQuery,
  useAdminUsersQuery,
  useCancelAdminBookingMutation,
  useCompleteBookingMutation,
  useDeleteAdminTourMutation,
  useReassignBookingGuideMutation,
  useToggleTourStatusMutation,
} from './api/useAdminQueries';

const EMPTY_BOOKINGS: Booking[] = [];
const EMPTY_TOURS: Tour[] = [];
const EMPTY_GUIDES: User[] = [];

export function useOperationsManager() {
  const subTab = useAdminUiStore((s) => s.operationsSubTab);
  const setSubTab = useAdminUiStore((s) => s.setOperationsSubTab);
  const bookingStatusFilter = useAdminUiStore((s) => s.bookingStatusFilter);
  const setBookingStatusFilter = useAdminUiStore((s) => s.setBookingStatusFilter);

  const [search, setSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [reassignGuideId, setReassignGuideId] = useState<string>('');
  const [confirmCancelBooking, setConfirmCancelBooking] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [confirmDeleteTourId, setConfirmDeleteTourId] = useState<number | null>(null);
  const [togglingTourId, setTogglingTourId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const bookingsQuery = useAdminBookingsQuery();
  const toursQuery = useAdminToursQuery();
  const guidesQuery = useAdminUsersQuery('GUIDE');
  const cancelBookingMutation = useCancelAdminBookingMutation();
  const reassignGuideMutation = useReassignBookingGuideMutation();
  const completeBookingMutation = useCompleteBookingMutation();
  const toggleTourStatusMutation = useToggleTourStatusMutation();
  const deleteTourMutation = useDeleteAdminTourMutation();

  const bookings = bookingsQuery.data ?? EMPTY_BOOKINGS;
  const tours = toursQuery.data ?? EMPTY_TOURS;
  const guides = guidesQuery.data ?? EMPTY_GUIDES;

  const selectedBooking = useMemo(
    () => (selectedBookingId != null ? bookings.find((b) => b.id === selectedBookingId) ?? null : null),
    [bookings, selectedBookingId]
  );

  const guideOptionsForSelectedBooking = useMemo(() => {
    if (!selectedBooking) return [];
    const targetRegionId = selectedBooking.tour?.regionId ?? selectedBooking.guide?.regionId ?? null;
    const targetRegionName = selectedBooking.tour?.regionName ?? selectedBooking.guide?.regionName ?? null;
    const currentGuideId = selectedBooking.guide?.id;

    return guides
      .filter((g) => {
        if (g.id === currentGuideId) return false;
        const sameRegion =
          (targetRegionId != null && g.regionId != null && g.regionId === targetRegionId) ||
          (Boolean(targetRegionName) && g.regionName === targetRegionName);
        return sameRegion;
      })
      .map((g) => ({ guide: g, sameRegion: true }));
  }, [guides, selectedBooking]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (bookingStatusFilter !== 'ALL' && b.status !== bookingStatusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        b.code.toLowerCase().includes(q) ||
        b.customer?.fullName.toLowerCase().includes(q) ||
        b.guide?.fullName.toLowerCase().includes(q) ||
        b.tourTitleSnapshot.toLowerCase().includes(q)
      );
    });
  }, [bookings, bookingStatusFilter, search]);

  const filteredTours = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tours;
    return tours.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.regionName.toLowerCase().includes(q) ||
        t.guide?.fullName.toLowerCase().includes(q)
    );
  }, [tours, search]);

  async function refreshAll() {
    setActionError(null);
    await Promise.all([bookingsQuery.refetch(), toursQuery.refetch(), guidesQuery.refetch()]);
  }

  function openBookingDetail(id: number) {
    setActionError(null);
    setConfirmCancelBooking(false);
    setCancelReason('');
    setReassignGuideId('');
    setSelectedBookingId(id);
  }

  function closeBookingDetail() {
    setConfirmCancelBooking(false);
    setCancelReason('');
    setReassignGuideId('');
    setSelectedBookingId(null);
  }

  async function handleReassignGuide() {
    if (!selectedBooking || !reassignGuideId) return;
    const targetId = Number(reassignGuideId);
    if (!Number.isFinite(targetId) || targetId <= 0) return;
    setActionError(null);
    try {
      await reassignGuideMutation.mutateAsync({
        bookingId: selectedBooking.id,
        guideId: targetId,
      });
      setReassignGuideId('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể điều chuyển Tour Guide');
    }
  }

  async function handleCompleteSelectedBooking() {
    if (!selectedBooking) return;
    setActionError(null);
    try {
      await completeBookingMutation.mutateAsync(selectedBooking.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể đánh dấu hoàn thành đơn');
    }
  }

  async function handleCancelSelectedBooking() {
    if (!selectedBooking) return;
    setActionError(null);
    try {
      await cancelBookingMutation.mutateAsync({
        id: selectedBooking.id,
        reason: cancelReason.trim() || undefined,
      });
      setConfirmCancelBooking(false);
      setCancelReason('');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể huỷ đơn đặt tour');
    }
  }

  async function handleToggleTourStatus(tourId: number, active: boolean) {
    setActionError(null);
    setTogglingTourId(tourId);
    try {
      await toggleTourStatusMutation.mutateAsync({ tourId, active });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái tour');
    } finally {
      setTogglingTourId(null);
    }
  }

  async function handleDeleteTour(id: number) {
    setActionError(null);
    try {
      await deleteTourMutation.mutateAsync(id);
      setConfirmDeleteTourId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể xoá tour mẫu');
      setConfirmDeleteTourId(null);
    }
  }

  const queryError = bookingsQuery.error ?? toursQuery.error;
  const error = actionError ?? (queryError instanceof Error ? queryError.message : null);

  return {
    subTab,
    setSubTab,
    bookingStatusFilter,
    setBookingStatusFilter,
    search,
    setSearch,
    bookings,
    tours,
    filteredBookings,
    filteredTours,
    selectedBooking,
    guideOptionsForSelectedBooking,
    reassignGuideId,
    setReassignGuideId,
    reassigningGuide: reassignGuideMutation.isPending,
    handleReassignGuide,
    completingBooking: completeBookingMutation.isPending,
    handleCompleteSelectedBooking,
    openBookingDetail,
    closeBookingDetail,
    confirmCancelBooking,
    setConfirmCancelBooking,
    cancelReason,
    setCancelReason,
    cancellingBooking: cancelBookingMutation.isPending,
    handleCancelSelectedBooking,
    togglingTourId,
    handleToggleTourStatus,
    confirmDeleteTourId,
    setConfirmDeleteTourId,
    deletingTourId: deleteTourMutation.isPending ? confirmDeleteTourId : null,
    handleDeleteTour,
    loading: bookingsQuery.isLoading || toursQuery.isLoading,
    refreshing: bookingsQuery.isFetching || toursQuery.isFetching,
    error,
    refreshAll,
  };
}
