import { IconBase, type IconSvgProps } from './IconBase';

export function CustomIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </IconBase>
  );
}
