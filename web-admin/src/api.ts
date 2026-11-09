import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ';
    return Promise.reject(new Error(msg));
  }
);

// ===================== Types =====================

export interface HelloData {
  status: string;
  databaseProduct: string;
  databaseName: string;
  regionCount: number;
  latencyMs: number;
}

export interface User {
  id: number;
  fullName: string;
  role: 'CUSTOMER' | 'GUIDE';
  email: string;
  phone: string;
  bio: string | null;
  yearsExperience: number | null;
  regionName: string | null;
}

export interface Region {
  id: number;
  code: string;
  name: string;
  province: string;
  description: string;
  imageUrl: string;
  tag: string;
  rating: number;
}

export interface PresetOption {
  id: number;
  regionId: number;
  category: string;
  title: string;
  pricePerPerson: number;
}

export interface TourStep {
  id?: number;
  dayNumber: number;
  category: string;
  title: string;
  pricePerPerson: number;
}

export interface Tour {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  days: number;
  basePricePerPerson: number;
  regionId: number;
  regionName: string;
  province: string;
  guide: User;
  createdAt: string;
  steps: TourStep[];
}

export type BookingStatus =
  | 'BOOKED_ORIGINAL'
  | 'WAITING_REQUOTE'
  | 'REQUOTED'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface BookingStep {
  id?: number;
  dayNumber: number;
  category: string;
  title: string;
  pricePerPerson: number;
  /** "PRESET" | "MODIFIED" | "CUSTOM" | "GUIDE" */
  noteType: string;
}

export interface Booking {
  id: number;
  code: string;
  status: BookingStatus;
  statusLabel: string;
  stepIndex: number;
  tour: Tour;
  customer: User;
  guide: User;
  startDate: string;
  days: number;
  guests: number;
  customerNote: string | null;
  guideNote: string | null;
  originalPricePerPerson: number;
  originalTotalPrice: number;
  currentPricePerPerson: number;
  groupAdjustment: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  steps: BookingStep[];
}

// ===================== Helpers =====================

export function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function statusBadge(status: BookingStatus): { bg: string; text: string } {
  switch (status) {
    case 'BOOKED_ORIGINAL':
      return { bg: 'bg-blue-100 text-blue-800 border-blue-300', text: '1. Đã đặt (Giá gốc)' };
    case 'WAITING_REQUOTE':
      return { bg: 'bg-amber-100 text-amber-900 border-amber-400', text: '2. Khách đã sửa · Chờ báo giá lại' };
    case 'REQUOTED':
      return { bg: 'bg-purple-100 text-purple-900 border-purple-400', text: '3. Đã báo giá lại · Chờ khách chốt' };
    case 'CONFIRMED':
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-400', text: '4. Đã đồng ý chốt Tour' };
    case 'CANCELLED':
      return { bg: 'bg-gray-200 text-gray-600 border-gray-300', text: 'Đã huỷ' };
  }
}

export function noteTypeBadge(noteType: string): { label: string; cls: string } {
  switch (noteType) {
    case 'MODIFIED':
      return { label: 'Khách đã sửa/đổi', cls: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'CUSTOM':
      return { label: 'Khách yêu cầu thêm', cls: 'bg-purple-100 text-purple-800 border-purple-300' };
    case 'GUIDE':
      return { label: 'Guide đã báo giá', cls: 'bg-blue-100 text-blue-800 border-blue-300' };
    default:
      return { label: 'Giữ nguyên gốc', cls: 'bg-gray-100 text-gray-600 border-gray-300' };
  }
}

// ===================== API Calls =====================

export async function getHello(): Promise<HelloData> {
  const res = await http.get('/api/hello');
  return res.data.data;
}

export async function getUsers(role: 'CUSTOMER' | 'GUIDE'): Promise<User[]> {
  const res = await http.get(`/api/users?role=${role}`);
  return res.data.data;
}

export async function getRegions(): Promise<Region[]> {
  const res = await http.get('/api/regions');
  return res.data.data;
}

export async function getOptionsByRegion(regionId: number): Promise<PresetOption[]> {
  const res = await http.get(`/api/options?regionId=${regionId}`);
  return res.data.data;
}

export async function getTours(guideId?: number): Promise<Tour[]> {
  const url = guideId ? `/api/tours?guideId=${guideId}` : '/api/tours';
  const res = await http.get(url);
  return res.data.data;
}

export async function createTour(payload: {
  guideId: number;
  regionId: number;
  title: string;
  description: string;
  imageUrl: string;
  days: number;
  steps: TourStep[];
}): Promise<Tour> {
  const res = await http.post('/api/tours', payload);
  return res.data.data;
}

export async function updateTour(
  tourId: number,
  payload: {
    guideId: number;
    regionId: number;
    title: string;
    description: string;
    imageUrl: string;
    days: number;
    steps: TourStep[];
  }
): Promise<Tour> {
  const res = await http.put(`/api/tours/${tourId}`, payload);
  return res.data.data;
}

export async function getBookings(params: { customerId?: number; guideId?: number }): Promise<Booking[]> {
  const q = params.customerId
    ? `?customerId=${params.customerId}`
    : params.guideId
    ? `?guideId=${params.guideId}`
    : '';
  const res = await http.get(`/api/bookings${q}`);
  return res.data.data;
}

export async function getBooking(id: number): Promise<Booking> {
  const res = await http.get(`/api/bookings/${id}`);
  return res.data.data;
}

export async function createBooking(payload: {
  tourId: number;
  customerId: number;
  startDate: string;
  days: number;
  guests: number;
  customerNote: string;
  customized: boolean;
  steps: BookingStep[];
}): Promise<Booking> {
  const res = await http.post('/api/bookings', payload);
  return res.data.data;
}

export async function customizeBooking(
  bookingId: number,
  payload: {
    startDate: string;
    days: number;
    guests: number;
    customerNote: string;
    steps: BookingStep[];
  }
): Promise<Booking> {
  const res = await http.put(`/api/bookings/${bookingId}/customize`, payload);
  return res.data.data;
}

export async function requoteBooking(
  bookingId: number,
  payload: {
    days: number;
    guests: number;
    groupAdjustment: number;
    guideNote: string;
    steps: BookingStep[];
  }
): Promise<Booking> {
  const res = await http.put(`/api/bookings/${bookingId}/requote`, payload);
  return res.data.data;
}

export async function confirmBooking(bookingId: number): Promise<Booking> {
  const res = await http.post(`/api/bookings/${bookingId}/confirm`);
  return res.data.data;
}

export async function cancelBooking(bookingId: number): Promise<Booking> {
  const res = await http.post(`/api/bookings/${bookingId}/cancel`);
  return res.data.data;
}
