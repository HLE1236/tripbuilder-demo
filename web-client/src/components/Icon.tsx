import type { SVGProps } from 'react';

export type IconName =
  | 'transport'
  | 'hotel'
  | 'food'
  | 'activity'
  | 'custom'
  | 'ticket'
  | 'compass'
  | 'calendar'
  | 'users'
  | 'user'
  | 'map-pin'
  | 'clock'
  | 'check'
  | 'check-circle'
  | 'x'
  | 'plus'
  | 'minus'
  | 'edit'
  | 'swap'
  | 'void'
  | 'restore'
  | 'star'
  | 'sun'
  | 'moon'
  | 'search'
  | 'logout'
  | 'phone'
  | 'arrow-right'
  | 'arrow-left'
  | 'external'
  | 'shield-check'
  | 'tag'
  | 'alert'
  | 'image'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'dashboard'
  | 'clipboard'
  | 'map'
  | 'heart'
  | 'bookmark'
  | 'zoom-in'
  | 'grid'
  | 'refresh'
  | 'sliders'
  | 'arrow-up-down'
  | 'camera';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}

export function categoryIconName(category: string): IconName {
  switch (category) {
    case 'Di chuyển':
      return 'transport';
    case 'Khách sạn':
      return 'hotel';
    case 'Ăn uống':
      return 'food';
    case 'Trải nghiệm':
      return 'activity';
    case 'Yêu cầu thêm':
      return 'custom';
    default:
      return 'tag';
  }
}

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  filled = false,
  className = '',
  'aria-hidden': ariaHidden = true,
  ...rest
}: IconProps) {
  const fill = filled ? 'currentColor' : 'none';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden={ariaHidden}
      {...rest}
    >
      {renderPaths(name)}
    </svg>
  );
}

function renderPaths(name: IconName) {
  switch (name) {
    case 'transport':
      return (
        <>
          <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
          <path d="M4 11h16v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />
          <circle cx="7.5" cy="14" r="0.8" fill="currentColor" />
          <circle cx="16.5" cy="14" r="0.8" fill="currentColor" />
        </>
      );
    case 'hotel':
      return (
        <>
          <path d="M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
          <path d="M3 14h18" />
          <path d="M7 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
          <path d="M3 18v2" />
          <path d="M21 18v2" />
        </>
      );
    case 'food':
      return (
        <>
          <path d="M4 3v7a3 3 0 0 0 6 0V3" />
          <path d="M7 3v18" />
          <path d="M15 3v18" />
          <path d="M15 3c2.5 0 4 2.2 4 5.5S17.5 14 15 14" />
        </>
      );
    case 'activity':
      return (
        <>
          <path d="M3 19l6-10 4 6 3-4 5 8H3Z" />
          <circle cx="17.5" cy="6.5" r="2" />
        </>
      );
    case 'custom':
      return (
        <>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </>
      );
    case 'ticket':
      return (
        <>
          <path d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
          <path d="M13 5v2" />
          <path d="M13 11v2" />
          <path d="M13 17v2" />
        </>
      );
    case 'compass':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
        </>
      );
    case 'calendar':
      return (
        <>
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M3 10h18" />
        </>
      );
    case 'users':
      return (
        <>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="3.5" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a3.5 3.5 0 0 1 0 6.74" />
        </>
      );
    case 'user':
      return (
        <>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      );
    case 'map-pin':
      return (
        <>
          <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
          <circle cx="12" cy="11" r="2.2" />
        </>
      );
    case 'clock':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      );
    case 'check':
      return <path d="M5 13l4 4L19 7" />;
    case 'check-circle':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </>
      );
    case 'x':
      return (
        <>
          <path d="M18 6L6 18" />
          <path d="M6 6l12 12" />
        </>
      );
    case 'plus':
      return (
        <>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </>
      );
    case 'minus':
      return <path d="M5 12h14" />;
    case 'edit':
      return (
        <>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
        </>
      );
    case 'swap':
      return (
        <>
          <path d="M16 3l4 4-4 4" />
          <path d="M20 7H4" />
          <path d="M8 21l-4-4 4-4" />
          <path d="M4 17h16" />
        </>
      );
    case 'void':
      return (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M5.6 5.6l12.8 12.8" />
        </>
      );
    case 'restore':
      return (
        <>
          <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
          <path d="M3 3v5h5" />
        </>
      );
    case 'star':
      return (
        <polygon points="12 2.5 14.9 8.4 21.4 9.3 16.7 13.9 17.8 20.4 12 17.3 6.2 20.4 7.3 13.9 2.6 9.3 9.1 8.4 12 2.5" />
      );
    case 'sun':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M4.93 19.07l1.41-1.41" />
          <path d="M17.66 6.34l1.41-1.41" />
        </>
      );
    case 'moon':
      return <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />;
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </>
      );
    case 'logout':
      return (
        <>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </>
      );
    case 'phone':
      return (
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.58 2.81.7A2 2 0 0 1 22 16.92Z" />
      );
    case 'arrow-right':
      return (
        <>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </>
      );
    case 'arrow-left':
      return (
        <>
          <path d="M19 12H5" />
          <path d="M11 6l-6 6 6 6" />
        </>
      );
    case 'external':
      return (
        <>
          <path d="M15 3h6v6" />
          <path d="M10 14L21 3" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </>
      );
    case 'shield-check':
      return (
        <>
          <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3Z" />
          <path d="M9 12l2 2 4-4" />
        </>
      );
    case 'tag':
      return (
        <>
          <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82l-9-9Z" />
          <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
        </>
      );
    case 'alert':
      return (
        <>
          <path d="M12 3L2 20h20L12 3Z" />
          <path d="M12 10v4" />
          <circle cx="12" cy="17" r="0.7" fill="currentColor" />
        </>
      );
    case 'image':
      return (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M21 16l-5-5-8 8" />
        </>
      );
    case 'chevron-down':
      return <path d="M6 9l6 6 6-6" />;
    case 'chevron-right':
      return <path d="M9 6l6 6-6 6" />;
    case 'chevron-left':
      return <path d="M15 6l-6 6 6 6" />;
    case 'dashboard':
      return (
        <>
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </>
      );
    case 'clipboard':
      return (
        <>
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </>
      );
    case 'map':
      return (
        <>
          <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </>
      );
    case 'heart':
      return (
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" />
      );
    case 'bookmark':
      return <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z" />;
    case 'zoom-in':
      return (
        <>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
          <path d="M11 8v6" />
          <path d="M8 11h6" />
        </>
      );
    case 'grid':
      return (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </>
      );
    case 'refresh':
      return (
        <>
          <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
          <path d="M16 16h5v5" />
        </>
      );
    case 'sliders':
      return (
        <>
          <path d="M4 21v-7" />
          <path d="M4 10V3" />
          <path d="M12 21v-9" />
          <path d="M12 8V3" />
          <path d="M20 21v-5" />
          <path d="M20 12V3" />
          <path d="M1 14h6" />
          <path d="M9 8h6" />
          <path d="M17 16h6" />
        </>
      );
    case 'arrow-up-down':
      return (
        <>
          <path d="M7 15l5 5 5-5" />
          <path d="M7 9l5-5 5 5" />
        </>
      );
    case 'camera':
      return (
        <>
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
          <circle cx="12" cy="13" r="3.5" />
        </>
      );
  }
}
