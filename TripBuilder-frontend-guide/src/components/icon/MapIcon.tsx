import { IconBase, type IconBaseProps } from './IconBase';

export function MapIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
      <path d="M9 3v15" />
      <path d="M15 6v15" />
    </IconBase>
  );
}
