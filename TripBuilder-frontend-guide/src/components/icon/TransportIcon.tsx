import { IconBase, type IconBaseProps } from './IconBase';

export function TransportIcon(props: IconBaseProps) {
  return (
    <IconBase {...props}>
      <path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" />
      <path d="M4 11h16v6a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1H7v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6Z" />
      <circle cx="7.5" cy="14" r="0.8" fill="currentColor" />
      <circle cx="16.5" cy="14" r="0.8" fill="currentColor" />
    </IconBase>
  );
}
