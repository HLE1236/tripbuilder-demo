import { apiClient } from '@/api/client';
import type { Booking } from '@/api/types';

export async function acceptBookingApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/accept`);
  return res.data.data;
}
