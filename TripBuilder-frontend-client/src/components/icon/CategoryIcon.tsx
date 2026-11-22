import type { IconSvgProps } from './IconBase';
import { ActivityIcon } from './ActivityIcon';
import { CustomIcon } from './CustomIcon';
import { FoodIcon } from './FoodIcon';
import { HotelIcon } from './HotelIcon';
import { TagIcon } from './TagIcon';
import { TransportIcon } from './TransportIcon';

export interface CategoryIconProps extends IconSvgProps {
  category: string;
}

export function CategoryIcon({ category, ...props }: CategoryIconProps) {
  switch (category) {
    case 'Di chuyển':
      return <TransportIcon {...props} />;
    case 'Khách sạn':
      return <HotelIcon {...props} />;
    case 'Ăn uống':
      return <FoodIcon {...props} />;
    case 'Trải nghiệm':
      return <ActivityIcon {...props} />;
    case 'Yêu cầu thêm':
      return <CustomIcon {...props} />;
    default:
      return <TagIcon {...props} />;
  }
}
