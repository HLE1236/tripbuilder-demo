import { IconBase, type IconSvgProps } from './IconBase';

export function FoodIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M4 3v7a3 3 0 0 0 6 0V3" />
      <path d="M7 3v18" />
      <path d="M15 3v18" />
      <path d="M15 3c2.5 0 4 2.2 4 5.5S17.5 14 15 14" />
    </IconBase>
  );
}
