import { IconBase, type IconSvgProps } from './IconBase';

export function ArrowLeftIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M19 12H5" />
      <path d="M11 6l-6 6 6 6" />
    </IconBase>
  );
}
