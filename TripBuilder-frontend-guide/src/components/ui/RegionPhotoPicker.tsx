import { useMemo, useState } from 'react';
import { CheckIcon, GridIcon, ImageIcon } from '@/components/icon';
import { SafeImage } from '@/components/ui/SafeImage';
import { useAllRegionPhotosQuery, useRegionPhotosQuery } from '@/hooks/api';

export interface RegionPhotoPickerProps {
  regionId: number;
  selectedUrls: string[];
  onToggleUrl: (url: string) => void;
  onBatchAddUrls?: (urls: string[]) => void;
  selectionMode?: 'multi' | 'single';
  compact?: boolean;
}

const PHOTO_CATEGORIES = [
  'Tất cả',
  'Toàn cảnh',
  'Trải nghiệm',
  'Lưu trú',
  'Ẩm thực',
  'Di chuyển',
] as const;

export function RegionPhotoPicker({
  regionId,
  selectedUrls,
  onToggleUrl,
  onBatchAddUrls,
  selectionMode = 'multi',
  compact = false,
}: RegionPhotoPickerProps) {
  const [includeSharedActivities, setIncludeSharedActivities] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');

  const { data: regionPhotos = [], isPending: loadingRegion } =
    useRegionPhotosQuery(regionId);
  const { data: allPhotos = [], isFetching: loadingAll } =
    useAllRegionPhotosQuery(includeSharedActivities);

  const loading = Boolean(regionId) && loadingRegion;

  const combinedPhotos = useMemo(() => {
    if (!includeSharedActivities) return regionPhotos;
    const seen = new Set(regionPhotos.map((p) => p.url));
    const activityExtras = allPhotos.filter(
      (p) => !seen.has(p.url) && p.url.includes('/images/activities/')
    );
    const otherRegionExtras = allPhotos.filter(
      (p) => !seen.has(p.url) && !p.url.includes('/images/activities/')
    );
    return [...regionPhotos, ...activityExtras, ...otherRegionExtras];
  }, [includeSharedActivities, regionPhotos, allPhotos]);

  const visiblePhotos = useMemo(() => {
    if (activeCategory === 'Tất cả') return combinedPhotos;
    return combinedPhotos.filter((p) => p.category === activeCategory);
  }, [combinedPhotos, activeCategory]);

  const handleQuickSelect8 = () => {
    if (!onBatchAddUrls || regionPhotos.length === 0) return;
    const top8 = regionPhotos.slice(0, 8).map((p) => p.url);
    onBatchAddUrls(top8);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {PHOTO_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              aria-pressed={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              className="chip text-[13px] font-medium py-1.5 px-3"
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={includeSharedActivities}
            onClick={() => setIncludeSharedActivities((prev) => !prev)}
            className="chip text-[13px] font-medium py-1.5 px-3"
          >
            <GridIcon size={16} strokeWidth={1.5} />
            <span>{loadingAll ? 'Đang tải' : 'Thêm ảnh dịch vụ chung'}</span>
          </button>

          {selectionMode === 'multi' && onBatchAddUrls && regionPhotos.length > 0 && (
            <button
              type="button"
              onClick={handleQuickSelect8}
              className="btn btn-ghost text-[13px] font-medium py-1.5 px-3 text-coral border-coral/35 hover:bg-coral-soft/50"
            >
              <ImageIcon size={16} strokeWidth={1.5} />
              <span>Chọn nhanh 8 ảnh tiêu biểu của vùng</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-6 text-center text-sm font-medium text-ink-3 border border-rule rounded-xl bg-surface-2">
          Đang tải kho ảnh thực tế của vùng
        </div>
      ) : visiblePhotos.length === 0 ? (
        <div className="p-5 text-center text-sm font-medium text-ink-3 border border-rule rounded-xl bg-surface-2">
          Không có ảnh trong mục &ldquo;{activeCategory}&rdquo;
        </div>
      ) : (
        <div
          className={`grid gap-3 ${
            compact
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 max-h-60 overflow-y-auto pr-1'
              : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 max-h-72 overflow-y-auto pr-1'
          }`}
        >
          {visiblePhotos.map((photo) => {
            const selectedIdx = selectedUrls.indexOf(photo.url);
            const isSelected = selectedIdx !== -1;

            return (
              <button
                key={`${photo.id}-${photo.url}`}
                type="button"
                onClick={() => onToggleUrl(photo.url)}
                aria-pressed={isSelected}
                title={`${photo.landmarkName} — ${photo.caption}`}
                className={`group relative rounded-xl overflow-hidden border text-left transition-colors duration-150 cursor-pointer bg-surface ${
                  isSelected
                    ? 'border-coral ring-2 ring-coral/30'
                    : 'border-rule hover:border-rule-strong'
                }`}
              >
                <div className="relative aspect-[4/3] bg-surface-2 overflow-hidden">
                  <SafeImage
                    src={photo.url}
                    alt={photo.landmarkName}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <span className="num absolute top-2 right-2 h-6 min-w-[26px] px-2 rounded-full bg-coral text-white text-[13px] font-semibold flex items-center justify-center">
                      {selectionMode === 'single' ? (
                        <CheckIcon size={14} strokeWidth={1.5} />
                      ) : (
                        `#${selectedIdx + 1}`
                      )}
                    </span>
                  )}
                  <span className="absolute bottom-2 left-2 rounded-md bg-black/75 text-white px-2 py-0.5 text-[13px] font-medium">
                    {photo.category}
                  </span>
                </div>
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-ink truncate">
                    {photo.landmarkName}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
