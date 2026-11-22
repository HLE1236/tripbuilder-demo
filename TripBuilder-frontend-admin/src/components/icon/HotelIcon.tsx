import { IconBase, type SvgIconProps } from './IconBase';

export function HotelIcon(props: SvgIconProps) {
  return (
    <IconBase {...props}>
      <path d="M3 18v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
      <path d="M3 14h18" />
      <path d="M7 10V8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2" />
      <path d="M3 18v2" />
      <path d="M21 18v2" />
    </IconBase>
  );
}
