export type UserRole = 'CUSTOMER' | 'GUIDE' | 'ADMIN';

export interface User {
  id: number;
  fullName: string;
  role: UserRole;
  email: string;
  phone: string | null;
  bio: string | null;
  yearsExperience: number | null;
  regionName: string | null;
  regionId?: number | null;
  avatarUrl?: string | null;
}

export interface DemoAccount {
  id: number;
  fullName: string;
  role: UserRole;
  email: string;
  avatarUrl: string | null;
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

export type PresetCategory = 'HOTEL' | 'FOOD' | 'TRANSPORT' | 'ACTIVITY';

export interface PresetOption {
  id: number;
  regionId: number;
  regionName?: string | null;
  category: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  pricePerPerson: number;
}

export interface Tour {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  days: number;
  basePricePerPerson: number;
  version: number;
  regionId: number;
  regionName: string;
  province: string;
  guide: User;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus =
  | 'BOOKED_ORIGINAL'
  | 'WAITING_REQUOTE'
  | 'REQUOTED'
  | 'CHANGE_REQUESTED'
  | 'CONFIRMED'
  | 'CANCELLED';

export interface Booking {
  id: number;
  code: string;
  status: BookingStatus;
  statusLabel: string;
  tourTitleSnapshot: string;
  tourVersionSnapshot: number;
  customer: User;
  guide: User;
  startDate: string;
  days: number;
  guests: number;
  totalPrice: number;
  confirmedTotalPrice?: number | null;
  createdAt: string;
  updatedAt: string;
  tour?: Tour;
}

export interface AdminOverview {
  totalRevenue: number;
  totalBookings: number;
  waitingRequoteBookings: number;
  requotedBookings: number;
  confirmedBookings: number;
  cancelledBookings?: number;
  totalTours: number;
  totalCustomers: number;
  totalGuides: number;
  totalRegions: number;
  totalPresetOptions: number;
}

export interface CreateAdminUserPayload {
  fullName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
  regionId?: number;
  regionName?: string;
  bio?: string;
  yearsExperience?: number;
}

export interface CreatePresetOptionPayload {
  regionId: number;
  category: PresetCategory;
  title: string;
  description?: string;
  pricePerPerson: number;
  imageUrl?: string;
}
