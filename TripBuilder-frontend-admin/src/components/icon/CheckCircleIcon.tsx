import { IconBase, type SvgIconProps } from './IconBase';

export function CheckCircleIcon(props: SvgIconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.5l2.5 2.5 4.5-5" />
    </IconBase>
  );
}
