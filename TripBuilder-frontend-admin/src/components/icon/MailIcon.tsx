import { IconBase, type SvgIconProps } from './IconBase';

export function MailIcon(props: SvgIconProps) {
  return (
    <IconBase {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </IconBase>
  );
}
