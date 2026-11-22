import { IconBase, type IconSvgProps } from './IconBase';

export function TagIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.82 0l7.17-7.17a2 2 0 0 0 0-2.82l-9-9Z" />
      <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
    </IconBase>
  );
}
