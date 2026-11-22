import { IconBase, type IconSvgProps } from './IconBase';

export function ZoomInIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
      <path d="M11 8v6" />
      <path d="M8 11h6" />
    </IconBase>
  );
}
