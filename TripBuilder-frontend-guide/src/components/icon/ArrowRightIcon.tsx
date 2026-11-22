import { IconBase, type IconBaseProps } from './IconBase';

export function ArrowRightIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </IconBase>
  );
}
