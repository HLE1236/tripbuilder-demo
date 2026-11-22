import { IconBase, type IconBaseProps } from './IconBase';

export function ClockIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </IconBase>
  );
}
