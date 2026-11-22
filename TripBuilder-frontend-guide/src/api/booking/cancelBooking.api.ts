import { apiClient } from '@/api/client';
import type { Booking } from '@/api/types';

export async function cancelBookingApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/cancel`);
  return res.data.data;
}
