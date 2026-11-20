import { useState } from 'react';
import { resolveMediaUrl } from '../api';
import { Icon } from './Icon';

export interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export function SafeImage({ src, alt, className = '', onClick }: SafeImageProps) {
  const resolvedSrc = resolveMediaUrl(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === resolvedSrc;

  if (failed) {
    return (
      <div
        onClick={onClick}
        className={`flex items-center justify-center bg-surface-2 text-ink-3 ${className}`}
      >
        <Icon name="image" size={20} className="opacity-45" />
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      loading="lazy"
      onClick={onClick}
      onError={() => setFailedSrc(resolvedSrc)}
      className={className}
    />
  );
}
