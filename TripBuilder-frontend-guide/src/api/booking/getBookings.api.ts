import { apiClient } from '@/api/client';
import type { Booking } from '@/api/types';

export async function getBookingsApi(): Promise<Booking[]> {
  const res = await apiClient.get('/api/bookings');
  return res.data.data;
}
