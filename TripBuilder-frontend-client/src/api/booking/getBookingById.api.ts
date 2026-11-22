import { apiClient } from '../client';
import type { Booking } from '../types';

export async function getBookingByIdApi(id: number): Promise<Booking> {
  const res = await apiClient.get(`/api/bookings/${id}`);
  return res.data.data;
}

export const getBooking = getBookingByIdApi;
