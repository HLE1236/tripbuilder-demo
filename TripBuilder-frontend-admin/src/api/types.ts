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

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: User;
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

export type PresetCategory = 'Khách sạn' | 'Ăn uống' | 'Di chuyển' | 'Trải nghiệm';

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
  active: boolean;
  averageRating: number | null;
  reviewCount: number;
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
  | 'CHANGE_REQUESTED'
  | 'REQUOTED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface BookingStepSummary {
  id?: number;
  dayNumber: number;
  category: string;
  title: string;
  pricePerPerson: number;
  noteType: string;
}

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
  adults?: number;
  children?: number;
  guideAccepted?: boolean;
  depositPercent?: number;
  depositAmount?: number;
  depositPaid?: boolean;
  cancelReason?: string | null;
  hasConfirmedSnapshot?: boolean;
  totalPrice: number;
  confirmedTotalPrice?: number | null;
  customerNote?: string | null;
  guideNote?: string | null;
  steps?: BookingStepSummary[];
  createdAt: string;
  updatedAt: string;
  tour?: Tour;
}

export interface AdminOverview {
  totalRevenue: number;
  collectedDeposit: number;
  totalBookings: number;
  waitingRequoteBookings: number;
  requotedBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalTours: number;
  totalCustomers: number;
  totalGuides: number;
  totalRegions: number;
  totalPresetOptions: number;
  pendingGuideApplications?: number;
}

export type GuideApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface GuideApplication {
  id: number;
  applicationCode: string;
  fullName: string;
  email: string;
  phone: string;
  regionId: number;
  regionName: string;
  province: string;
  yearsExperience: number | null;
  licenseNumber: string | null;
  languages: string | null;
  bio: string;
  status: GuideApplicationStatus;
  reviewNote: string | null;
  reviewedByName: string | null;
  createdUserId: number | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface ApproveGuideApplicationPayload {
  regionId?: number;
  reviewNote?: string;
}

export interface RejectGuideApplicationPayload {
  reviewNote: string;
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

export interface UpdateAdminUserPayload {
  fullName: string;
  phone?: string;
  regionId?: number;
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
