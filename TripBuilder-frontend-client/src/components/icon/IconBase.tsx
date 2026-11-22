import type { ReactNode, SVGProps } from 'react';

export interface IconSvgProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  size?: number;
  strokeWidth?: number;
  filled?: boolean;
  className?: string;
}

interface IconBaseProps extends IconSvgProps {
  children: ReactNode;
}

export function IconBase({
  size = 16,
  strokeWidth = 1.75,
  filled = false,
  className = '',
  'aria-hidden': ariaHidden = true,
  children,
  ...rest
}: IconBaseProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`.trim()}
      aria-hidden={ariaHidden}
      {...rest}
    >
      {children}
    </svg>
  );
}
