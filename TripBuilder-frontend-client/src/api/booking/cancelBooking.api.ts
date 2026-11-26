import { apiClient } from '../client';
import type { Booking } from '../types';

export async function cancelBookingApi(bookingId: number, reason?: string): Promise<Booking> {
  const res = await apiClient.post(
    `/api/bookings/${bookingId}/cancel`,
    reason !== undefined ? { reason } : undefined
  );
  return res.data.data;
}

export const cancelBooking = cancelBookingApi;
