import { apiClient } from '../client';
import type { Booking, BookingStep, ServiceMode } from '../types';

export interface CustomizeBookingPayload {
  startDate: string;
  days: number;
  guests: number;
  serviceMode: ServiceMode;
  customerNote: string;
  steps: BookingStep[];
}

export async function customizeBookingApi(
  bookingId: number,
  payload: CustomizeBookingPayload
): Promise<Booking> {
  const res = await apiClient.put(`/api/bookings/${bookingId}/customize`, payload);
  return res.data.data;
}

export const customizeBooking = customizeBookingApi;
