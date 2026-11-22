import type { IconBaseProps } from './IconBase';
import { ActivityIcon } from './ActivityIcon';
import { CustomIcon } from './CustomIcon';
import { FoodIcon } from './FoodIcon';
import { HotelIcon } from './HotelIcon';
import { TagIcon } from './TagIcon';
import { TransportIcon } from './TransportIcon';
import type { IconName } from './Icon';

export interface CategoryIconProps extends IconBaseProps {
  category: string;
}

export function categoryIconName(category: string): IconName {
  switch (category) {
    case 'Di chuyển':
      return 'transport';
    case 'Khách sạn':
      return 'hotel';
    case 'Ăn uống':
      return 'food';
    case 'Trải nghiệm':
      return 'activity';
    case 'Yêu cầu thêm':
      return 'custom';
    default:
      return 'tag';
  }
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
