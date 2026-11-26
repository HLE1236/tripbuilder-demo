import { apiClient } from '../client';
import type { Booking } from '../types';

export async function cancelAdminBookingApi(id: number, reason?: string): Promise<Booking> {
  const trimmed = reason?.trim();
  const res = await apiClient.post(
    `/api/bookings/${id}/cancel`,
    trimmed ? { reason: trimmed } : undefined
  );
  return res.data.data;
}
