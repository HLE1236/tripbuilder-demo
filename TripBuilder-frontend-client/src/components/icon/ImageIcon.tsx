import { IconBase, type IconSvgProps } from './IconBase';

export function ImageIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path d="M21 16l-5-5-8 8" />
    </IconBase>
  );
}
