import { IconBase, type SvgIconProps } from './IconBase';

export function PlusIcon(props: SvgIconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}
