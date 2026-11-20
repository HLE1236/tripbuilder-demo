import { useCallback, useEffect, useRef, useState } from 'react';
import type { PhotoItem } from '../api';
import { resolveMediaUrl } from '../api';
import { Icon } from './Icon';

export interface TravelPhotoLightboxProps {
  photos: PhotoItem[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  regionTitle?: string;
}

export function TravelPhotoLightbox({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
  regionTitle,
}: TravelPhotoLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [prevKey, setPrevKey] = useState(`${isOpen}-${initialIndex}-${photos.length}`);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentKey = `${isOpen}-${initialIndex}-${photos.length}`;
  if (currentKey !== prevKey) {
    setPrevKey(currentKey);
    if (isOpen) {
      const clamped = Math.max(0, Math.min(initialIndex, Math.max(photos.length - 1, 0)));
      setActiveIndex(clamped);
      setZoomed(false);
    }
  }

  const goPrev = useCallback(() => {
    if (photos.length <= 1) return;
    setZoomed(false);
    setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goNext = useCallback(() => {
    if (photos.length <= 1) return;
    setZoomed(false);
    setActiveIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, goPrev, goNext]);

  useEffect(() => {
    if (!isOpen) return;
    thumbRefs.current[activeIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }, [activeIndex, isOpen]);

  if (!isOpen || photos.length === 0) return null;

  const current = photos[activeIndex] ?? photos[0];
  const resolvedUrl = resolveMediaUrl(current.url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={current.landmarkName || regionTitle || 'Thư viện ảnh hành trình'}
      className="fixed inset-0 z-50 flex flex-col bg-[#0D0B0A]/96 text-[#F7F4EE] backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex min-w-0 items-center gap-3">
          {regionTitle && (
            <span className="truncate text-sm font-medium text-[#D9CFC0]">
              {regionTitle}
            </span>
          )}
          {current.category && (
            <span className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-sm font-medium text-[#F7F4EE]">
              {current.category}
            </span>
          )}
          <span className="num text-sm text-[#B9AFA0]">
            {String(activeIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
              zoomed
                ? 'border-[#7AB8A8] bg-[#7AB8A8]/20 text-[#93C9BB]'
                : 'border-white/20 bg-white/5 text-[#F7F4EE] hover:bg-white/15'
            }`}
            aria-label={zoomed ? 'Thu nhỏ 1x' : 'Phóng to 2x'}
          >
            <Icon name="zoom-in" size={16} />
            <span className="num">{zoomed ? '2×' : '1×'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-[#F7F4EE] transition-colors duration-150 hover:bg-white/15"
            aria-label="Đóng trình xem ảnh"
          >
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 sm:px-14"
        onClick={(e) => e.stopPropagation()}
      >
        {photos.length > 1 && (
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#1A1714]/80 text-[#F7F4EE] transition-colors duration-150 hover:bg-[#1A1714] sm:left-5"
            aria-label="Ảnh trước"
          >
            <Icon name="chevron-left" size={20} />
          </button>
        )}

        <div
          className={`flex max-h-full max-w-full items-center justify-center ${
            zoomed ? 'overflow-auto' : 'overflow-hidden'
          }`}
        >
          <img
            src={resolvedUrl}
            alt={current.landmarkName || current.caption || 'Ảnh địa danh'}
            onClick={() => setZoomed((z) => !z)}
            className={`max-h-[64vh] max-w-full rounded-lg object-contain transition-transform duration-150 select-none ${
              zoomed ? 'scale-[2] cursor-zoom-out' : 'scale-100 cursor-zoom-in'
            }`}
          />
        </div>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#1A1714]/80 text-[#F7F4EE] transition-colors duration-150 hover:bg-[#1A1714] sm:right-5"
            aria-label="Ảnh tiếp theo"
          >
            <Icon name="chevron-right" size={20} />
          </button>
        )}
      </div>

      {/* Caption & Metadata */}
      <div
        className="border-t border-white/10 bg-[#14110F]/90 px-4 py-3 sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-w-5xl flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-semibold text-[#FAF8F4] sm:text-xl">
              {current.landmarkName}
            </h3>
            {current.caption && (
              <p className="mt-0.5 text-sm text-[#D4CEC2]">{current.caption}</p>
            )}
          </div>
          {current.credit && (
            <div className="flex shrink-0 items-center gap-1.5 text-sm text-[#A39A8C]">
              <Icon name="camera" size={15} />
              <span>{current.credit}</span>
            </div>
          )}
        </div>

        {/* Filmstrip Thumbnail */}
        {photos.length > 1 && (
          <div className="mx-auto mt-3 flex max-w-5xl gap-2 overflow-x-auto pb-1 no-scrollbar">
            {photos.map((photo, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={`${photo.id}-${idx}`}
                  ref={(el) => {
                    thumbRefs.current[idx] = el;
                  }}
                  type="button"
                  onClick={() => {
                    setZoomed(false);
                    setActiveIndex(idx);
                  }}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition-opacity duration-150 ${
                    isActive
                      ? 'border-[#E08B6B] ring-2 ring-[#E08B6B]/60 opacity-100'
                      : 'border-white/15 opacity-55 hover:opacity-90'
                  }`}
                  aria-label={`Xem ảnh ${idx + 1}: ${photo.landmarkName}`}
                >
                  <img
                    src={resolveMediaUrl(photo.url)}
                    alt={photo.landmarkName}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
