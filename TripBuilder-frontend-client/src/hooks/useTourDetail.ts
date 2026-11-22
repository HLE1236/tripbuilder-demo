import { useMemo, useState } from 'react';
import type { PhotoItem, Tour, TourStep } from '../api/types';
import { tourToPhotoItems } from '../utils/tour';

export function useTourDetail(tour: Tour) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [customLightboxPhotos, setCustomLightboxPhotos] = useState<PhotoItem[] | null>(null);

  const photos = useMemo(() => tourToPhotoItems(tour), [tour]);

  const openGalleryAt = (index: number) => {
    setCustomLightboxPhotos(null);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const openStepPhoto = (step: TourStep) => {
    const stepUrl = step.imageUrl || tour.imageUrl;
    const matchIdx = photos.findIndex((p) => p.url === stepUrl);
    if (matchIdx >= 0) {
      openGalleryAt(matchIdx);
      return;
    }
    const extraPhoto: PhotoItem = {
      id: 9000 + (step.id || step.dayNumber),
      url: stepUrl,
      landmarkName: step.title,
      caption: `Ngày ${String(step.dayNumber).padStart(2, '0')} · ${step.category}`,
      category: step.category,
      credit: tour.regionName,
    };
    setCustomLightboxPhotos([extraPhoto, ...photos]);
    setLightboxIndex(0);
    setLightboxOpen(true);
  };

  const dayGroups = useMemo(() => {
    const maxDay = Math.max(tour.days, ...tour.steps.map((s) => s.dayNumber), 1);
    return Array.from({ length: maxDay }, (_, idx) => {
      const dayNumber = idx + 1;
      const items = tour.steps.filter((s) => s.dayNumber === dayNumber);
      const subtotal = items.reduce((acc, s) => acc + (s.pricePerPerson || 0), 0);
      return { dayNumber, items, subtotal };
    }).filter((d) => d.items.length > 0);
  }, [tour]);

  const bentoPhotos = photos.slice(0, 5);

  return {
    photos,
    bentoPhotos,
    dayGroups,
    lightboxOpen,
    setLightboxOpen,
    lightboxIndex,
    customLightboxPhotos,
    openGalleryAt,
    openStepPhoto,
  };
}
