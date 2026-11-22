import type { PhotoItem, Tour } from '../api/types';

export function categoryDotClass(category: string): string {
  switch (category) {
    case 'Khách sạn':
      return 'bg-indigo';
    case 'Ăn uống':
      return 'bg-orange';
    case 'Di chuyển':
      return 'bg-sky';
    case 'Trải nghiệm':
      return 'bg-emerald';
    default:
      return 'bg-coral';
  }
}

export function tourToPhotoItems(tour: Tour): PhotoItem[] {
  if (tour.galleryItems && tour.galleryItems.length > 0) {
    return tour.galleryItems;
  }
  const urls = tour.galleryUrls?.length ? tour.galleryUrls : [tour.imageUrl];
  return urls.map((url, idx) => ({
    id: idx + 1,
    url,
    landmarkName: tour.title,
    caption: `${tour.regionName} · ${tour.province}`,
    category: 'Hành trình',
    credit: `Guide ${tour.guide.fullName}`,
  }));
}
