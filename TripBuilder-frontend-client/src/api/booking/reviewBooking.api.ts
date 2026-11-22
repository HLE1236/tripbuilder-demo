import { apiClient } from '../client';
import type { Booking } from '../types';

export interface ReviewBookingPayload {
  rating: number;
  review: string;
}

export async function reviewBookingApi(
  bookingId: number,
  payload: ReviewBookingPayload
): Promise<Booking> {
  const res = await apiClient.post(`/api/bookings/${bookingId}/review`, payload);
  return res.data.data;
}

export const reviewBooking = reviewBookingApi;
