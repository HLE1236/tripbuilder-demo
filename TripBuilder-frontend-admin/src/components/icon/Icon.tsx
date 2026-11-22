import type { ComponentType } from 'react';
import type { SvgIconProps } from './IconBase';
import { ActivityIcon } from './ActivityIcon';
import { AlertIcon } from './AlertIcon';
import { ArrowRightIcon } from './ArrowRightIcon';
import { CheckCircleIcon } from './CheckCircleIcon';
import { ClipboardIcon } from './ClipboardIcon';
import { ClockIcon } from './ClockIcon';
import { CompassIcon } from './CompassIcon';
import { DashboardIcon } from './DashboardIcon';
import { EditIcon } from './EditIcon';
import { ExternalIcon } from './ExternalIcon';
import { FoodIcon } from './FoodIcon';
import { HotelIcon } from './HotelIcon';
import { ImageIcon } from './ImageIcon';
import { LayersIcon } from './LayersIcon';
import { LockIcon } from './LockIcon';
import { LogoutIcon } from './LogoutIcon';
import { MailIcon } from './MailIcon';
import { MapPinIcon } from './MapPinIcon';
import { MoonIcon } from './MoonIcon';
import { PlusIcon } from './PlusIcon';
import { RefreshIcon } from './RefreshIcon';
import { SearchIcon } from './SearchIcon';
import { ShieldCheckIcon } from './ShieldCheckIcon';
import { SunIcon } from './SunIcon';
import { TagIcon } from './TagIcon';
import { TicketIcon } from './TicketIcon';
import { TransportIcon } from './TransportIcon';
import { TrashIcon } from './TrashIcon';
import { UserIcon } from './UserIcon';
import { UsersIcon } from './UsersIcon';
import { XIcon } from './XIcon';

const ICON_REGISTRY = {
  activity: ActivityIcon,
  alert: AlertIcon,
  'arrow-right': ArrowRightIcon,
  'check-circle': CheckCircleIcon,
  clipboard: ClipboardIcon,
  clock: ClockIcon,
  compass: CompassIcon,
  dashboard: DashboardIcon,
  edit: EditIcon,
  external: ExternalIcon,
  food: FoodIcon,
  hotel: HotelIcon,
  image: ImageIcon,
  layers: LayersIcon,
  lock: LockIcon,
  logout: LogoutIcon,
  mail: MailIcon,
  'map-pin': MapPinIcon,
  moon: MoonIcon,
  plus: PlusIcon,
  refresh: RefreshIcon,
  search: SearchIcon,
  'shield-check': ShieldCheckIcon,
  sun: SunIcon,
  tag: TagIcon,
  ticket: TicketIcon,
  transport: TransportIcon,
  trash: TrashIcon,
  user: UserIcon,
  users: UsersIcon,
  x: XIcon,
} satisfies Record<string, ComponentType<SvgIconProps>>;

export type IconName = keyof typeof ICON_REGISTRY;

export interface IconProps extends SvgIconProps {
  name: IconName;
}

export function Icon({ name, ...props }: IconProps) {
  const IconComponent = ICON_REGISTRY[name];
  return <IconComponent {...props} />;
}
