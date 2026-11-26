import { apiClient } from '../client';
import type { Booking } from '../types';

export async function completeBookingApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/complete`);
  return res.data.data;
}
