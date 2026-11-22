import { IconBase, type IconBaseProps } from './IconBase';

export function ArrowLeftIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </IconBase>
  );
}
