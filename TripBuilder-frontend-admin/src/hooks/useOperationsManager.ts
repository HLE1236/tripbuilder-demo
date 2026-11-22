import { useMemo, useState } from 'react';
import type { Booking, Tour } from '../api';
import { useAdminUiStore } from '../stores';
import {
  useAdminBookingsQuery,
  useAdminToursQuery,
  useCancelAdminBookingMutation,
  useDeleteAdminTourMutation,
} from './api/useAdminQueries';

const EMPTY_BOOKINGS: Booking[] = [];
const EMPTY_TOURS: Tour[] = [];

export function useOperationsManager() {
  const subTab = useAdminUiStore((s) => s.operationsSubTab);
  const setSubTab = useAdminUiStore((s) => s.setOperationsSubTab);

  const [search, setSearch] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [confirmCancelBooking, setConfirmCancelBooking] = useState(false);
  const [confirmDeleteTourId, setConfirmDeleteTourId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const bookingsQuery = useAdminBookingsQuery();
  const toursQuery = useAdminToursQuery();
  const cancelBookingMutation = useCancelAdminBookingMutation();
  const deleteTourMutation = useDeleteAdminTourMutation();

  const bookings = bookingsQuery.data ?? EMPTY_BOOKINGS;
  const tours = toursQuery.data ?? EMPTY_TOURS;

  const selectedBooking = useMemo(
    () => (selectedBookingId != null ? bookings.find((b) => b.id === selectedBookingId) ?? null : null),
    [bookings, selectedBookingId]
  );

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter(
      (b) =>
        b.code.toLowerCase().includes(q) ||
        b.customer?.fullName.toLowerCase().includes(q) ||
        b.guide?.fullName.toLowerCase().includes(q) ||
        b.tourTitleSnapshot.toLowerCase().includes(q)
    );
  }, [bookings, search]);

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
    await Promise.all([bookingsQuery.refetch(), toursQuery.refetch()]);
  }

  function openBookingDetail(id: number) {
    setActionError(null);
    setConfirmCancelBooking(false);
    setSelectedBookingId(id);
  }

  function closeBookingDetail() {
    setConfirmCancelBooking(false);
    setSelectedBookingId(null);
  }

  async function handleCancelSelectedBooking() {
    if (!selectedBooking) return;
    setActionError(null);
    try {
      await cancelBookingMutation.mutateAsync(selectedBooking.id);
      setConfirmCancelBooking(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Không thể huỷ đơn đặt tour');
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
    search,
    setSearch,
    bookings,
    tours,
    filteredBookings,
    filteredTours,
    selectedBooking,
    openBookingDetail,
    closeBookingDetail,
    confirmCancelBooking,
    setConfirmCancelBooking,
    cancellingBooking: cancelBookingMutation.isPending,
    handleCancelSelectedBooking,
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
