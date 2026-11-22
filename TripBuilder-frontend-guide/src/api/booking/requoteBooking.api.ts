import { apiClient } from '@/api/client';
import type { Booking, BookingStep } from '@/api/types';

export interface RequoteBookingPayload {
  days: number;
  guests: number;
  groupAdjustment: number;
  guideNote: string;
  steps: BookingStep[];
}

export async function requoteBookingApi(
  bookingId: number,
  payload: RequoteBookingPayload
): Promise<Booking> {
  const res = await apiClient.put(`/api/bookings/${bookingId}/requote`, payload);
  return res.data.data;
}
