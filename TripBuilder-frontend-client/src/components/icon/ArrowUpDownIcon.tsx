import { IconBase, type IconSvgProps } from './IconBase';

export function ArrowUpDownIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M7 15l5 5 5-5" />
      <path d="M7 9l5-5 5 5" />
    </IconBase>
  );
}
