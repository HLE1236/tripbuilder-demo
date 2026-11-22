import { IconBase, type SvgIconProps } from './IconBase';

export function ShieldCheckIcon(props: SvgIconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 2l7 3v6c0 5-3.5 9-7 11-3.5-2-7-6-7-11V5l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </IconBase>
  );
}
