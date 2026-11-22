import { apiClient } from '../client';
import type { Booking } from '../types';

export async function confirmBookingApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/confirm`);
  return res.data.data;
}

export const confirmBooking = confirmBookingApi;
