import { IconBase, type IconSvgProps } from './IconBase';

export function CompassIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
    </IconBase>
  );
}
