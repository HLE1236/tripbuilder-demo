import type { BookingStatus, ServiceMode } from '@/api/types';

export const CLIENT_PORT_URL =
  import.meta.env.VITE_CLIENT_PORT_URL || 'http://localhost:5173';

export const ADMIN_PORT_URL =
  import.meta.env.VITE_ADMIN_PORT_URL || 'http://localhost:5175';

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export function serviceModeMeta(mode?: string | null): {
  mode: ServiceMode;
  label: string;
} {
  if (mode === 'REMOTE') {
    return { mode: 'REMOTE', label: 'Đặt hộ từ xa' };
  }
  return { mode: 'COMPANION', label: 'Guide đồng hành' };
}

export function statusMeta(status: BookingStatus): {
  tone: BadgeTone;
  tagClass: string;
  /** @deprecated Tạm giữ tương thích trước Wave 3 */
  stampClass: string;
  short: string;
  hint: string;
  actionNeeded: boolean;
} {
  switch (status) {
    case 'BOOKED_ORIGINAL':
      return {
        tone: 'info',
        tagClass: 'tag-jade',
        stampClass: 'stamp-navy',
        short: 'Lịch chuẩn · Mới',
        hint: 'Lịch chuẩn · Có thể chốt ngay hoặc chờ Guide kiểm tra',
        actionNeeded: true,
      };
    case 'WAITING_REQUOTE':
      return {
        tone: 'warning',
        tagClass: 'tag-ochre',
        stampClass: 'stamp-amber',
        short: 'Chờ báo giá lại',
        hint: 'Cần Guide báo giá lại các mục tuỳ chỉnh',
        actionNeeded: true,
      };
    case 'CHANGE_REQUESTED':
      return {
        tone: 'warning',
        tagClass: 'tag-ochre',
        stampClass: 'stamp-amber',
        short: 'Xin đổi sau chốt',
        hint: 'Khách xin điều chỉnh sau khi đã chốt',
        actionNeeded: true,
      };
    case 'REQUOTED':
      return {
        tone: 'info',
        tagClass: 'tag-terracotta',
        stampClass: 'stamp-carbon',
        short: 'Đã gửi báo giá',
        hint: 'Chờ khách duyệt & chốt chuyến',
        actionNeeded: false,
      };
    case 'CONFIRMED':
      return {
        tone: 'success',
        tagClass: 'tag-forest',
        stampClass: 'stamp-green',
        short: 'Đã xác nhận · Đã chốt',
        hint: 'Sẵn sàng khởi hành',
        actionNeeded: false,
      };
    case 'CANCELLED':
      return {
        tone: 'error',
        tagClass: 'tag-crimson',
        stampClass: 'stamp-red',
        short: 'Đã huỷ',
        hint: 'Đơn đã đóng',
        actionNeeded: false,
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
      return { label: 'Khách đã đổi', tone: 'warning', tagClass: 'tag-ochre', stampClass: 'stamp-amber' };
    case 'REMOVED':
      return { label: 'Đã bỏ', tone: 'error', tagClass: 'tag-crimson', stampClass: 'stamp-red' };
    case 'CUSTOM':
      return { label: 'Chờ báo giá', tone: 'info', tagClass: 'tag-terracotta', stampClass: 'stamp-carbon' };
    case 'GUIDE':
      return { label: 'Guide đã báo giá', tone: 'success', tagClass: 'tag-forest', stampClass: 'stamp-green' };
    case 'ALTERNATIVE':
      return { label: 'Đề xuất thay thế', tone: 'warning', tagClass: 'tag-ochre', stampClass: 'stamp-amber' };
    default:
      return { label: 'Lịch chuẩn', tone: 'neutral', tagClass: 'tag-neutral', stampClass: 'stamp-neutral' };
  }
}
