import { apiClient } from '../client';
import type { Booking } from '../types';

export async function cancelBookingApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/cancel`);
  return res.data.data;
}

export const cancelBooking = cancelBookingApi;
