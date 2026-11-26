import { IconBase, type IconSvgProps } from './IconBase';

export function EyeIcon(props: IconSvgProps) {
  return (
    <IconBase {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}
