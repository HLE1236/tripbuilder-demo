import { useMemo, useState } from 'react';
import type { Booking, Tour } from '../api';
import { useAdminUiStore } from '../stores';
import { useAdminBookingsQuery, useAdminToursQuery } from './api/useAdminQueries';

const EMPTY_BOOKINGS: Booking[] = [];
const EMPTY_TOURS: Tour[] = [];

export function useOperationsManager() {
  const subTab = useAdminUiStore((s) => s.operationsSubTab);
  const setSubTab = useAdminUiStore((s) => s.setOperationsSubTab);

  const [search, setSearch] = useState('');

  const bookingsQuery = useAdminBookingsQuery();
  const toursQuery = useAdminToursQuery();

  const bookings = bookingsQuery.data ?? EMPTY_BOOKINGS;
  const tours = toursQuery.data ?? EMPTY_TOURS;

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
    await Promise.all([bookingsQuery.refetch(), toursQuery.refetch()]);
  }

  const queryError = bookingsQuery.error ?? toursQuery.error;

  return {
    subTab,
    setSubTab,
    search,
    setSearch,
    bookings,
    tours,
    filteredBookings,
    filteredTours,
    loading: bookingsQuery.isLoading || toursQuery.isLoading,
    refreshing: bookingsQuery.isFetching || toursQuery.isFetching,
    error: queryError instanceof Error ? queryError.message : null,
    refreshAll,
  };
}
