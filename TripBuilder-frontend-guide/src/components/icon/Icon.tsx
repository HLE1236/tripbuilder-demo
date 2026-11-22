import type { ComponentType } from 'react';
import type { IconBaseProps } from './IconBase';
import { ActivityIcon } from './ActivityIcon';
import { AlertIcon } from './AlertIcon';
import { ArrowLeftIcon } from './ArrowLeftIcon';
import { ArrowRightIcon } from './ArrowRightIcon';
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
import { DashboardIcon } from './DashboardIcon';
import { EditIcon } from './EditIcon';
import { ExternalIcon } from './ExternalIcon';
import { FoodIcon } from './FoodIcon';
import { GridIcon } from './GridIcon';
import { HotelIcon } from './HotelIcon';
import { ImageIcon } from './ImageIcon';
import { LogoutIcon } from './LogoutIcon';
import { MapIcon } from './MapIcon';
import { MapPinIcon } from './MapPinIcon';
import { MinusIcon } from './MinusIcon';
import { MoonIcon } from './MoonIcon';
import { PhoneIcon } from './PhoneIcon';
import { PlusIcon } from './PlusIcon';
import { RestoreIcon } from './RestoreIcon';
import { SearchIcon } from './SearchIcon';
import { ShieldCheckIcon } from './ShieldCheckIcon';
import { SunIcon } from './SunIcon';
import { SwapIcon } from './SwapIcon';
import { TagIcon } from './TagIcon';
import { TransportIcon } from './TransportIcon';
import { UsersIcon } from './UsersIcon';
import { VoidIcon } from './VoidIcon';
import { XIcon } from './XIcon';

const ICON_REGISTRY = {
  activity: ActivityIcon,
  alert: AlertIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-right': ArrowRightIcon,
  calendar: CalendarIcon,
  camera: CameraIcon,
  check: CheckIcon,
  'check-circle': CheckCircleIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  clipboard: ClipboardIcon,
  clock: ClockIcon,
  compass: CompassIcon,
  custom: CustomIcon,
  dashboard: DashboardIcon,
  edit: EditIcon,
  external: ExternalIcon,
  food: FoodIcon,
  grid: GridIcon,
  hotel: HotelIcon,
  image: ImageIcon,
  logout: LogoutIcon,
  map: MapIcon,
  'map-pin': MapPinIcon,
  minus: MinusIcon,
  moon: MoonIcon,
  phone: PhoneIcon,
  plus: PlusIcon,
  restore: RestoreIcon,
  search: SearchIcon,
  'shield-check': ShieldCheckIcon,
  sun: SunIcon,
  swap: SwapIcon,
  tag: TagIcon,
  transport: TransportIcon,
  users: UsersIcon,
  void: VoidIcon,
  x: XIcon,
} satisfies Record<string, ComponentType<IconBaseProps>>;

export type IconName = keyof typeof ICON_REGISTRY;

export interface IconProps extends IconBaseProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = ICON_REGISTRY[name];
  return <IconComponent {...props} />;
}
