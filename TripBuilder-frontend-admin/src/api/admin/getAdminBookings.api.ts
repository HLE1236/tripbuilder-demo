import { apiClient } from '../client';
import type { Booking } from '../types';

export async function getAdminBookingsApi(): Promise<Booking[]> {
  const res = await apiClient.get('/api/admin/bookings');
  return res.data.data;
}
