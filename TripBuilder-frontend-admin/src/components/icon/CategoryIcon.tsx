import type { SvgIconProps } from './IconBase';
import { ActivityIcon } from './ActivityIcon';
import { FoodIcon } from './FoodIcon';
import { HotelIcon } from './HotelIcon';
import { TagIcon } from './TagIcon';
import { TransportIcon } from './TransportIcon';

export interface CategoryIconProps extends SvgIconProps {
  category: string;
}

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  const upper = category.trim().toUpperCase();
  if (upper === 'HOTEL' || category === 'Khách sạn') {
    return <HotelIcon {...props} />;
  }
  if (upper === 'FOOD' || category === 'Ăn uống') {
    return <FoodIcon {...props} />;
  }
  if (upper === 'TRANSPORT' || category === 'Di chuyển') {
    return <TransportIcon {...props} />;
  }
  if (upper === 'ACTIVITY' || category === 'Trải nghiệm') {
    return <ActivityIcon {...props} />;
  }
  return <TagIcon {...props} />;
}
