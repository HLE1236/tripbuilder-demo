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

export interface SaveTourPayload {
  guideId: number;
  regionId: number;
  title: string;
  description: string;
  imageUrl: string;
  galleryUrls?: string[];
  /** @deprecated Tạm giữ tương thích ngược cho GuidePresetEditor trước Phase 4 */
  galleryImages?: string[];
  days: number;
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
