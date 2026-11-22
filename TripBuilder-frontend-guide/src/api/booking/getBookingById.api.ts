import { apiClient } from '@/api/client';
import type { Booking } from '@/api/types';

export async function getBookingByIdApi(bookingId: number): Promise<Booking> {
  const res = await apiClient.get(`/api/bookings/${bookingId}`);
  return res.data.data;
}
