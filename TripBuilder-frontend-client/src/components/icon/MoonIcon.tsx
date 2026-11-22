import { IconBase, type IconSvgProps } from './IconBase';

export function MoonIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
    </IconBase>
  );
}
