import { IconBase, type SvgIconProps } from './IconBase';

export function LockIcon(props: SvgIconProps) {
  return (
    <IconBase {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </IconBase>
  );
}
