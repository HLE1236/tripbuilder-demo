import { IconBase, type IconSvgProps } from './IconBase';

export function SearchIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </IconBase>
  );
}
