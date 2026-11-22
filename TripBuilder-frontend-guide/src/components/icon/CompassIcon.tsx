import { IconBase, type IconBaseProps } from './IconBase';

export function CompassIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <polygon points="15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5 15.5 8.5" />
    </IconBase>
  );
}
