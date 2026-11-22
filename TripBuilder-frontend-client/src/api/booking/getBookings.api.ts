import { apiClient } from '../client';
import type { Booking } from '../types';

export async function getBookingsApi(): Promise<Booking[]> {
  const res = await apiClient.get('/api/bookings');
  return res.data.data;
}

export const getBookings = getBookingsApi;
