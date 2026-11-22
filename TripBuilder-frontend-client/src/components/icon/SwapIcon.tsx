import { IconBase, type IconSvgProps } from './IconBase';

export function SwapIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M16 3l4 4-4 4" />
      <path d="M20 7H4" />
      <path d="M8 21l-4-4 4-4" />
      <path d="M4 17h16" />
    </IconBase>
  );
}
