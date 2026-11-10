import type { SVGProps } from 'react';

/**
 * Bộ icon nét (stroke 1.75, 24×24) dùng thống nhất cho toàn app.
 * Thay cho emoji để giữ một hệ biểu tượng đồng nhất.
 */
export type IconName =
  | 'user'
  | 'compass'
  | 'bus'
  | 'bed'
  | 'ticket'
  | 'utensils'
  | 'sparkle'
  | 'swap'
  | 'x'
  | 'undo'
  | 'plus'
  | 'minus'
  | 'calendar'
  | 'users'
  | 'clock'
  | 'pin'
  | 'check'
  | 'arrow-left'
  | 'arrow-right'
  | 'refresh'
  | 'sun'
  | 'moon'
  | 'send'
  | 'gift'
  | 'pencil'
  | 'message'
  | 'alert'
  | 'globe'
  | 'wallet'
  | 'cake'
  | 'flame'
  | 'camera'
  | 'leaf';

const PATHS: Record<IconName, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  bus: (
    <>
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M4 11h16M8 21v-4M16 21v-4" />
      <circle cx="8" cy="14" r="0.6" />
      <circle cx="16" cy="14" r="0.6" />
    </>
  ),
  bed: (
    <>
      <path d="M3 18V6M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5" />
      <circle cx="7" cy="11" r="2" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 0 0 0 4v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a2 2 0 0 1 0-4V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1z" transform="translate(0 1.5)" />
      <path d="M14 6v2M14 11v2M14 16v1" />
    </>
  ),
  utensils: (
    <>
      <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10" />
      <path d="M17 21V3c-2 1-3 4-3 7h3" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z" />
  ),
  swap: (
    <>
      <path d="M7 4 3 8l4 4M3 8h13" />
      <path d="m17 20 4-4-4-4M21 16H8" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6 6 18" />,
  undo: (
    <>
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.8 3.5 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  'arrow-left': <path d="M19 12H5M11 6l-6 6 6 6" />,
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16" />
      <path d="M20 20v-4h-4" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  send: (
    <>
      <path d="M21 3 10 14" />
      <path d="m21 3-7 18-4-7-7-4z" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="8" width="18" height="5" rx="1" />
      <path d="M5 13v8h14v-8M12 8v13" />
      <path d="M12 8C10 4 6.5 4.5 7 7c.3 1.2 2.5 1 5 1zM12 8c2-4 5.5-3.5 5-1-.3 1.2-2.5 1-5 1z" />
    </>
  ),
  pencil: (
    <>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="m14 6 4 4" />
    </>
  ),
  message: <path d="M4 5h16v11H9l-5 4z" />,
  alert: (
    <>
      <path d="M12 3 2 20h20z" />
      <path d="M12 10v4M12 17v.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
    </>
  ),
  wallet: (
    <>
      <path d="M4 7h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M4 7l11-3v3M16 13.5h1.5" />
    </>
  ),
  cake: (
    <>
      <path d="M4 21v-7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7zM4 16c2 1.5 4 1.5 5.3 0 1.4 1.5 4 1.5 5.4 0 1.3 1.5 3.3 1.5 5.3 0" />
      <path d="M12 12V8M12 5.5V5" />
    </>
  ),
  flame: <path d="M12 21c-4 0-6.5-2.7-6.5-6.2 0-3.6 3-5.5 3.5-9.3 2.5 1.6 4 4 4 6.5 1-.5 1.8-1.6 2-3 1.8 1.6 3.5 3.8 3.5 6.3 0 3.4-2.5 5.7-6.5 5.7z" />,
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" />
      <path d="M5 19 13 11" />
    </>
  ),
};

export default function Icon({
  name,
  size = 16,
  className,
  ...rest
}: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ''}`}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Icon theo danh mục dịch vụ của một dòng lịch trình. */
export function categoryIconName(category: string): IconName {
  const c = category.toLowerCase();
  if (c.includes('di chuyển') || c.includes('xe')) return 'bus';
  if (c.includes('khách sạn') || c.includes('lưu trú') || c.includes('resort')) return 'bed';
  if (c.includes('ăn') || c.includes('ẩm thực')) return 'utensils';
  if (c.includes('yêu cầu')) return 'sparkle';
  return 'ticket';
}
