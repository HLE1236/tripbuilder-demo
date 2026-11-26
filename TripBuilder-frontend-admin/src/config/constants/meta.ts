import type { BookingStatus, PresetCategory, UserRole } from '../../api/types';

export const ROLE_META: Record<UserRole, { label: string; tagClass: string }> = {
  ADMIN: { label: 'Quản trị viên', tagClass: 'tag-terracotta' },
  GUIDE: { label: 'Tour Guide', tagClass: 'tag-jade' },
  CUSTOMER: { label: 'Khách hàng', tagClass: 'tag-neutral' },
};

export const PRESET_CATEGORIES: {
  value: PresetCategory;
  label: string;
  badgeClass: string;
  aliases: string[];
}[] = [
  { value: 'Khách sạn', label: 'Khách sạn & Lưu trú', badgeClass: 'category-badge-hotel', aliases: ['HOTEL', 'Khách sạn'] },
  { value: 'Ăn uống', label: 'Ẩm thực & Nhà hàng', badgeClass: 'category-badge-food', aliases: ['FOOD', 'Ăn uống'] },
  { value: 'Di chuyển', label: 'Di chuyển & Xe đưa đón', badgeClass: 'category-badge-transport', aliases: ['TRANSPORT', 'Di chuyển'] },
  { value: 'Trải nghiệm', label: 'Trải nghiệm & Tham quan', badgeClass: 'category-badge-activity', aliases: ['ACTIVITY', 'Trải nghiệm'] },
];

export function presetCategoryMeta(category: string): {
  label: string;
  badgeClass: string;
  icon: 'hotel' | 'food' | 'transport' | 'activity' | 'tag';
} {
  const upper = category.trim().toUpperCase();
  if (upper === 'HOTEL' || category === 'Khách sạn') {
    return { label: 'Khách sạn', badgeClass: 'category-badge-hotel', icon: 'hotel' };
  }
  if (upper === 'FOOD' || category === 'Ăn uống') {
    return { label: 'Ăn uống', badgeClass: 'category-badge-food', icon: 'food' };
  }
  if (upper === 'TRANSPORT' || category === 'Di chuyển') {
    return { label: 'Di chuyển', badgeClass: 'category-badge-transport', icon: 'transport' };
  }
  if (upper === 'ACTIVITY' || category === 'Trải nghiệm') {
    return { label: 'Trải nghiệm', badgeClass: 'category-badge-activity', icon: 'activity' };
  }
  return { label: category, badgeClass: 'category-badge-custom', icon: 'tag' };
}

export function bookingStatusMeta(status: BookingStatus | string): {
  label: string;
  tagClass: string;
} {
  switch (status) {
    case 'BOOKED_ORIGINAL':
      return { label: 'Lịch chuẩn · Mới', tagClass: 'tag-jade' };
    case 'WAITING_REQUOTE':
      return { label: 'Chờ báo giá lại', tagClass: 'tag-ochre' };
    case 'CHANGE_REQUESTED':
      return { label: 'Xin đổi sau chốt', tagClass: 'tag-ochre' };
    case 'REQUOTED':
      return { label: 'Đã gửi báo giá', tagClass: 'tag-terracotta' };
    case 'CONFIRMED':
      return { label: 'Đã chốt', tagClass: 'tag-forest' };
    case 'COMPLETED':
      return { label: 'Đã hoàn thành', tagClass: 'tag-forest' };
    case 'CANCELLED':
      return { label: 'Đã huỷ', tagClass: 'tag-crimson' };
    default:
      return { label: status, tagClass: 'tag-neutral' };
  }
}
