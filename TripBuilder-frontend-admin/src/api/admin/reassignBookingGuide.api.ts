import { apiClient } from '../client';
import type { Booking } from '../types';

export async function reassignBookingGuideApi(bookingId: number, guideId: number): Promise<Booking> {
  const res = await apiClient.put(`/api/admin/bookings/${bookingId}/reassign`, { guideId });
  return res.data.data;
}
