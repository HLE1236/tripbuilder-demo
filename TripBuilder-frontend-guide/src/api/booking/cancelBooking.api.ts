import { apiClient } from '@/api/client';
import type { Booking } from '@/api/types';

export async function cancelBookingApi(
  bookingId: number,
  reason?: string
): Promise<Booking> {
  const trimmed = reason?.trim();
  const res = await apiClient.post(
    `/api/bookings/${bookingId}/cancel`,
    trimmed ? { reason: trimmed } : undefined
  );
  return res.data.data;
}
