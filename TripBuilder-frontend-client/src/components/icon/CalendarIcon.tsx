import { IconBase, type IconSvgProps } from './IconBase';

export function CalendarIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 10h18" />
    </IconBase>
  );
}
