import { IconBase, type IconSvgProps } from './IconBase';

export function ActivityIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M3 19l6-10 4 6 3-4 5 8H3Z" />
      <circle cx="17.5" cy="6.5" r="2" />
    </IconBase>
  );
}
