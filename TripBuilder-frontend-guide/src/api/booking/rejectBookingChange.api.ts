import { apiClient } from '@/api/client';
import type { Booking } from '@/api/types';

export async function rejectBookingChangeApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/reject-change`);
  return res.data.data;
}
