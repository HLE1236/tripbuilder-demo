import { IconBase, type IconBaseProps } from './IconBase';

export function XIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </IconBase>
  );
}
