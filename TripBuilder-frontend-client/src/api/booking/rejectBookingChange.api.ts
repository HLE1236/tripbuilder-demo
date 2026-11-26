import { apiClient } from '../client';
import type { Booking } from '../types';

export async function rejectBookingChangeApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/reject-change`);
  return res.data.data;
}

export const rejectBookingChange = rejectBookingChangeApi;
