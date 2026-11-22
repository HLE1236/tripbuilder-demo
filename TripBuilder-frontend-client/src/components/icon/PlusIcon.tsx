import { IconBase, type IconSvgProps } from './IconBase';

export function PlusIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </IconBase>
  );
}
