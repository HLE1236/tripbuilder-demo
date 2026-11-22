import type { BookingStatus, ServiceMode } from '../../api/types';

export const GUIDE_PORT_URL =
  import.meta.env.VITE_GUIDE_PORT_URL ||
  import.meta.env.VITE_ADMIN_PORT_URL ||
  'http://localhost:5174';

export const ADMIN_PORT_URL =
  import.meta.env.VITE_SUPER_ADMIN_PORT_URL || 'http://localhost:5175';

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
