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
  originalTitle?: string | null;
  originalPricePerPerson?: number | null;
  /** "PRESET" | "MODIFIED" | "REMOVED" | "CUSTOM" | "GUIDE" */
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

/**
 * Nhãn trạng thái đơn. `bg` là lớp màu (chữ + viền) theo hệ token "ví vé".
 * `stamp` là chữ ngắn in trên con dấu.
 */
export function statusBadge(status: BookingStatus): { bg: string; text: string; stamp: string } {
  switch (status) {
    case 'BOOKED_ORIGINAL':
      return { bg: 'text-navy dark:text-navy-ink bg-stock-2', text: 'Bước 1 · Đã gửi yêu cầu đặt tour', stamp: 'Đã xuất vé' };
    case 'WAITING_REQUOTE':
      return { bg: 'text-amber bg-amber-soft', text: 'Bước 2 · Đã tuỳ chỉnh, chờ Guide báo giá', stamp: 'Chờ báo giá' };
    case 'REQUOTED':
      return { bg: 'text-carbon bg-carbon-soft', text: 'Bước 3 · Guide đã báo giá, chờ khách đồng ý', stamp: 'Đã báo giá' };
    case 'CONFIRMED':
      return { bg: 'text-green bg-green-soft', text: 'Bước 4 · Đã đồng ý & hoàn tất', stamp: 'Đã xác nhận' };
    case 'CANCELLED':
      return { bg: 'text-red bg-red-soft', text: 'Đơn đã huỷ', stamp: 'Void · Đã huỷ' };
  }
}

export function noteTypeBadge(noteType: string): { label: string; cls: string } {
  switch (noteType) {
    case 'MODIFIED':
      return { label: 'Đã đổi', cls: 'text-amber' };
    case 'REMOVED':
      return { label: 'Đã bỏ', cls: 'text-red' };
    case 'CUSTOM':
      return { label: 'Yêu cầu thêm', cls: 'text-carbon' };
    case 'GUIDE':
      return { label: 'Guide đã báo giá', cls: 'text-green' };
    default:
      return { label: 'Theo lịch chuẩn', cls: 'text-ink-3' };
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
