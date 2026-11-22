import type { ComponentType } from 'react';
import type { IconSvgProps } from './IconBase';
import { ActivityIcon } from './ActivityIcon';
import { AlertIcon } from './AlertIcon';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import { ArrowRightIcon } from './ArrowRightIcon';
import { ArrowUpDownIcon } from './ArrowUpDownIcon';
import { CalendarIcon } from './CalendarIcon';
import { CameraIcon } from './CameraIcon';
import { CheckCircleIcon } from './CheckCircleIcon';
import { CheckIcon } from './CheckIcon';
import { ChevronLeftIcon } from './ChevronLeftIcon';
import { ChevronRightIcon } from './ChevronRightIcon';
import { ClipboardIcon } from './ClipboardIcon';
import { ClockIcon } from './ClockIcon';
import { CompassIcon } from './CompassIcon';
import { CustomIcon } from './CustomIcon';
import { EditIcon } from './EditIcon';
import { ExternalIcon } from './ExternalIcon';
import { FoodIcon } from './FoodIcon';
import { HeartIcon } from './HeartIcon';
import { HotelIcon } from './HotelIcon';
import { ImageIcon } from './ImageIcon';
import { LogoutIcon } from './LogoutIcon';
import { MapPinIcon } from './MapPinIcon';
import { MinusIcon } from './MinusIcon';
import { MoonIcon } from './MoonIcon';
import { PhoneIcon } from './PhoneIcon';
import { PlusIcon } from './PlusIcon';
import { RefreshIcon } from './RefreshIcon';
import { RestoreIcon } from './RestoreIcon';
import { SearchIcon } from './SearchIcon';
import { ShieldCheckIcon } from './ShieldCheckIcon';
import { StarIcon } from './StarIcon';
import { SunIcon } from './SunIcon';
import { SwapIcon } from './SwapIcon';
import { TagIcon } from './TagIcon';
import { TransportIcon } from './TransportIcon';
import { UsersIcon } from './UsersIcon';
import { VoidIcon } from './VoidIcon';
import { XIcon } from './XIcon';
import { ZoomInIcon } from './ZoomInIcon';

const ICON_MAP = {
  transport: TransportIcon,
  hotel: HotelIcon,
  food: FoodIcon,
  activity: ActivityIcon,
  custom: CustomIcon,
  tag: TagIcon,
  compass: CompassIcon,
  calendar: CalendarIcon,
  users: UsersIcon,
  'map-pin': MapPinIcon,
  clock: ClockIcon,
  check: CheckIcon,
  'check-circle': CheckCircleIcon,
  x: XIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  edit: EditIcon,
  swap: SwapIcon,
  void: VoidIcon,
  restore: RestoreIcon,
  star: StarIcon,
  sun: SunIcon,
  moon: MoonIcon,
  search: SearchIcon,
  logout: LogoutIcon,
  phone: PhoneIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  external: ExternalIcon,
  'shield-check': ShieldCheckIcon,
  alert: AlertIcon,
  image: ImageIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  clipboard: ClipboardIcon,
  heart: HeartIcon,
  'zoom-in': ZoomInIcon,
  refresh: RefreshIcon,
  'arrow-up-down': ArrowUpDownIcon,
  camera: CameraIcon,
} satisfies Record<string, ComponentType<IconSvgProps>>;

export type IconName = keyof typeof ICON_MAP;

export interface IconProps extends IconSvgProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const Component = ICON_MAP[name];
  return <Component {...props} />;
}
