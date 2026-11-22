import { apiClient } from '../client';
import type { Booking } from '../types';

export async function cancelAdminBookingApi(id: number): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${id}/cancel`);
  return res.data.data;
}
