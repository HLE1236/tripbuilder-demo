import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const TOKEN_KEY = 'tb_client_token';

let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

const http = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

http.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && unauthorizedHandler) {
      unauthorizedHandler();
    }
    const msg = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ';
    return Promise.reject(new Error(msg));
  }
);

// ===================== Types =====================

export interface User {
  id: number;
  fullName: string;
  role: 'CUSTOMER' | 'GUIDE';
  email: string;
  phone: string;
  bio: string | null;
  yearsExperience: number | null;
  regionName: string | null;
  avatarUrl?: string | null;
}

export interface DemoAccount {
  id: number;
  fullName: string;
  role: 'CUSTOMER' | 'GUIDE';
  email: string;
  avatarUrl: string | null;
  regionName: string | null;
}

export interface PhotoItem {
  id: number;
  url: string;
  landmarkName: string;
  caption: string;
  category: string;
  credit: string;
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
  photoCount?: number;
  previewPhotos?: PhotoItem[];
}

export interface PresetOption {
  id: number;
  regionId: number;
  category: string;
  title: string;
  imageUrl?: string | null;
  pricePerPerson: number;
}

export interface TourStep {
  id?: number;
  dayNumber: number;
  category: string;
  title: string;
  imageUrl?: string | null;
  pricePerPerson: number;
}

export interface Tour {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  galleryUrls: string[];
  galleryItems?: PhotoItem[];
  days: number;
  basePricePerPerson: number;
  version: number;
  regionId: number;
  regionName: string;
  province: string;
  guide: User;
  createdAt: string;
  updatedAt: string;
  steps: TourStep[];
}

export type BookingStatus =
  | 'BOOKED_ORIGINAL'
  | 'WAITING_REQUOTE'
  | 'REQUOTED'
  | 'CHANGE_REQUESTED'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface BookingStep {
  id?: number;
  dayNumber: number;
  category: string;
  title: string;
  imageUrl?: string | null;
  pricePerPerson: number;
  originalTitle?: string | null;
  originalPricePerPerson?: number | null;
  noteType: string;
}

export interface BookingRevision {
  id: number;
  roundNo: number;
  actorRole: 'CUSTOMER' | 'GUIDE' | string;
  actorName: string;
  actionLabel: string;
  note: string | null;
  totalPrice: number;
  createdAt: string;
}

export type ServiceMode = 'COMPANION' | 'REMOTE';

export interface Booking {
  id: number;
  code: string;
  status: BookingStatus;
  statusLabel: string;
  stepIndex: number;
  tour: Tour;
  tourTitleSnapshot: string;
  tourVersionSnapshot: number;
  latestTourVersion: number;
  customer: User;
  guide: User;
  startDate: string;
  days: number;
  guests: number;
  serviceMode?: ServiceMode | string | null;
  customerNote: string | null;
  guideNote: string | null;
  customerRating?: number | null;
  customerReview?: string | null;
  originalPricePerPerson: number;
  originalTotalPrice: number;
  currentPricePerPerson: number;
  groupAdjustment: number;
  totalPrice: number;
  confirmedTotalPrice?: number | null;
  revisionCount: number;
  postConfirmAdjustment: boolean;
  createdAt: string;
  updatedAt: string;
  steps: BookingStep[];
  revisions: BookingRevision[];
}

// ===================== Helpers =====================

export const DEFAULT_TRAVEL_IMAGE = '/images/tours/ha-long/01-bay-panorama.jpg';

export function resolveMediaUrl(url?: string | null): string {
  const trimmed = url?.trim();
  if (!trimmed) return DEFAULT_TRAVEL_IMAGE;
  if (trimmed.startsWith('/images/')) {
    const apiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');
    return apiBase ? `${apiBase}${trimmed}` : trimmed;
  }
  return trimmed;
}

export function formatVnd(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function serviceModeMeta(mode?: string | null): {
  mode: ServiceMode;
  label: string;
  short: string;
} {
  if (mode === 'REMOTE') {
    return {
      mode: 'REMOTE',
      label: 'Đặt hộ từ xa',
      short: 'Đặt hộ từ xa',
    };
  }
  return {
    mode: 'COMPANION',
    label: 'Guide đồng hành',
    short: 'Guide đồng hành',
  };
}

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export function statusMeta(status: BookingStatus): {
  tone: BadgeTone;
  tagClass: string;
  /** @deprecated Tạm giữ tương thích trước Wave 3 */
  stampClass: string;
  short: string;
  hint: string;
} {
  switch (status) {
    case 'BOOKED_ORIGINAL':
      return {
        tone: 'info',
        tagClass: 'tag-jade',
        stampClass: 'stamp-navy',
        short: 'Lịch chuẩn · Sẵn sàng chốt',
        hint: 'Lịch chuẩn · Có thể chốt ngay hoặc chờ Guide kiểm tra',
      };
    case 'WAITING_REQUOTE':
      return {
        tone: 'warning',
        tagClass: 'tag-ochre',
        stampClass: 'stamp-amber',
        short: 'Chờ báo giá lại',
        hint: 'Guide đang rà dịch vụ và báo giá',
      };
    case 'REQUOTED':
      return {
        tone: 'info',
        tagClass: 'tag-terracotta',
        stampClass: 'stamp-carbon',
        short: 'Đã có báo giá mới',
        hint: 'Chờ bạn duyệt & chốt chuyến',
      };
    case 'CHANGE_REQUESTED':
      return {
        tone: 'warning',
        tagClass: 'tag-ochre',
        stampClass: 'stamp-amber',
        short: 'Xin điều chỉnh sau chốt',
        hint: 'Guide đang xử lý thay đổi',
      };
    case 'CONFIRMED':
      return {
        tone: 'success',
        tagClass: 'tag-forest',
        stampClass: 'stamp-green',
        short: 'Đã xác nhận · Đã chốt',
        hint: 'Sẵn sàng khởi hành',
      };
    case 'CANCELLED':
      return {
        tone: 'error',
        tagClass: 'tag-crimson',
        stampClass: 'stamp-red',
        short: 'Đã huỷ',
        hint: 'Đơn đã đóng',
      };
  }
}

export function noteTypeMeta(noteType: string): {
  label: string;
  tone: BadgeTone;
  tagClass: string;
  /** @deprecated Tạm giữ tương thích trước Wave 3 */
  stampClass: string;
} {
  switch (noteType) {
    case 'MODIFIED':
      return { label: 'Đã đổi', tone: 'warning', tagClass: 'tag-ochre', stampClass: 'stamp-amber' };
    case 'REMOVED':
      return { label: 'Đã bỏ', tone: 'error', tagClass: 'tag-crimson', stampClass: 'stamp-red' };
    case 'CUSTOM':
      return { label: 'Yêu cầu thêm', tone: 'info', tagClass: 'tag-terracotta', stampClass: 'stamp-carbon' };
    case 'GUIDE':
      return { label: 'Guide đã báo giá', tone: 'success', tagClass: 'tag-forest', stampClass: 'stamp-green' };
    case 'ALTERNATIVE':
      return { label: 'Guide đề xuất thay', tone: 'warning', tagClass: 'tag-ochre', stampClass: 'stamp-amber' };
    default:
      return { label: 'Theo lịch gốc', tone: 'neutral', tagClass: 'tag-neutral', stampClass: 'stamp-neutral' };
  }
}

// ===================== Auth & Data APIs =====================

export async function authLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  const res = await http.post('/api/auth/login', {
    email,
    password,
    expectedRole: 'CUSTOMER',
  });
  return res.data.data;
}

export async function authMe(): Promise<User> {
  const res = await http.get('/api/auth/me');
  return res.data.data;
}

export async function getDemoAccounts(): Promise<DemoAccount[]> {
  const res = await http.get('/api/auth/demo-accounts?role=CUSTOMER');
  return res.data.data;
}

export async function getRegions(): Promise<Region[]> {
  const res = await http.get('/api/regions');
  return res.data.data;
}

export async function getRegionPhotos(regionId: number, category?: string): Promise<PhotoItem[]> {
  const res = await http.get(`/api/regions/${regionId}/photos`, {
    params: category ? { category } : undefined,
  });
  return res.data.data;
}

export async function getAllRegionPhotos(category?: string): Promise<PhotoItem[]> {
  const res = await http.get('/api/regions/photos', {
    params: category ? { category } : undefined,
  });
  return res.data.data;
}

export async function getOptionsByRegion(regionId: number): Promise<PresetOption[]> {
  const res = await http.get(`/api/options?regionId=${regionId}`);
  return res.data.data;
}

export interface TourFilterParams {
  regionId?: number;
  minDays?: number;
  maxDays?: number;
  q?: string;
  sort?: string;
}

export async function getTours(params?: TourFilterParams): Promise<Tour[]> {
  const cleanParams = params
    ? Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
      )
    : undefined;
  const res = await http.get('/api/tours', {
    params: cleanParams && Object.keys(cleanParams).length > 0 ? cleanParams : undefined,
  });
  return res.data.data;
}

export async function getFavoriteTourIds(): Promise<number[]> {
  const res = await http.get('/api/favorites');
  return res.data.data;
}

export async function saveFavoriteTour(tourId: number): Promise<number[]> {
  const res = await http.post(`/api/favorites/${tourId}`);
  return res.data.data;
}

export async function removeFavoriteTour(tourId: number): Promise<number[]> {
  const res = await http.delete(`/api/favorites/${tourId}`);
  return res.data.data;
}

export async function getBookings(): Promise<Booking[]> {
  const res = await http.get('/api/bookings');
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
  serviceMode: ServiceMode;
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
    serviceMode: ServiceMode;
    customerNote: string;
    steps: BookingStep[];
  }
): Promise<Booking> {
  const res = await http.put(`/api/bookings/${bookingId}/customize`, payload);
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

export async function reviewBooking(
  bookingId: number,
  payload: { rating: number; review: string }
): Promise<Booking> {
  const res = await http.post(`/api/bookings/${bookingId}/review`, payload);
  return res.data.data;
}
