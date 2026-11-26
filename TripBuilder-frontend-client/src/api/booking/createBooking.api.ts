import { apiClient } from '../client';
import type { Booking, BookingStep, ServiceMode } from '../types';

export interface CreateBookingPayload {
  tourId: number;
  customerId: number;
  startDate: string;
  days: number;
  guests: number;
  adults?: number;
  children?: number;
  serviceMode: ServiceMode;
  customerNote: string;
  customized: boolean;
  steps: BookingStep[];
}

export async function createBookingApi(payload: CreateBookingPayload): Promise<Booking> {
  const res = await apiClient.post('/api/bookings', payload);
  return res.data.data;
}

export const createBooking = createBookingApi;
