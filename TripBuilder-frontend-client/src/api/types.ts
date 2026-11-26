export interface User {
  id: number;
  fullName: string;
  role: 'CUSTOMER' | 'GUIDE' | 'ADMIN';
  email: string;
  phone: string;
  bio: string | null;
  yearsExperience: number | null;
  regionName: string | null;
  avatarUrl?: string | null;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: User;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

export interface ForgotPasswordResponse {
  message: string;
  devOtp?: string | null;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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

export interface TourReview {
  bookingCode: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
  active?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  reviews?: TourReview[];
  regionId: number;
  regionName: string;
  province: string;
  guide: User;
  createdAt: string;
  updatedAt: string;
  steps: TourStep[];
}

export type TourResponse = Tour;

export interface TourFilterParams {
  regionId?: number;
  minDays?: number;
  maxDays?: number;
  q?: string;
  sort?: string;
}

export type BookingStatus =
  | 'BOOKED_ORIGINAL'
  | 'WAITING_REQUOTE'
  | 'REQUOTED'
  | 'CHANGE_REQUESTED'
  | 'CONFIRMED'
  | 'COMPLETED'
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
  adults?: number | null;
  children?: number | null;
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
  guideAccepted?: boolean;
  depositPercent?: number | null;
  depositAmount?: number | null;
  depositPaid?: boolean;
  cancelReason?: string | null;
  hasConfirmedSnapshot?: boolean;
  createdAt: string;
  updatedAt: string;
  steps: BookingStep[];
  revisions: BookingRevision[];
}

export type BookingResponse = Booking;

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedBookingId: number | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  unreadCount: number;
  items: NotificationItem[];
}
