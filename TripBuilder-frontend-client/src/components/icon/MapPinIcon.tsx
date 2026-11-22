import { IconBase, type IconSvgProps } from './IconBase';

export function MapPinIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M12 21s-6-5.33-6-10a6 6 0 1 1 12 0c0 4.67-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </IconBase>
  );
}
