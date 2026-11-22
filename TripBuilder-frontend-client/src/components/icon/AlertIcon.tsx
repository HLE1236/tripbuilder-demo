import { IconBase, type IconSvgProps } from './IconBase';

export function AlertIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M12 3L2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.7" fill="currentColor" />
    </IconBase>
  );
}
