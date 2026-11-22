import { IconBase, type IconSvgProps } from './IconBase';

export function VoidIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.6 5.6l12.8 12.8" />
    </IconBase>
  );
}
