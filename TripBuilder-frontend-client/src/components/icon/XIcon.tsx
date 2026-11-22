import { IconBase, type IconSvgProps } from './IconBase';

export function XIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </IconBase>
  );
}
