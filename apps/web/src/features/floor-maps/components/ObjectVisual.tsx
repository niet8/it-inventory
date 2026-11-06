import { DoorOpenIcon, type LucideIcon, SofaIcon, SproutIcon, ToiletIcon, UsersIcon } from 'lucide-react';

import { CELL_SIZE } from '@/features/floor-maps/lib/editor';
import { OBJECT_TYPES, type ObjectType, type Rotation } from '@/features/floor-maps/lib/objectTypes';
import { cn } from '@/shared/lib/utils';

const IMAGES: Partial<Record<ObjectType, string>> = {
  desk: '/floor-map/desk.webp',
  'ping-pong': '/floor-map/ping-pong.webp',
};

const ICONS: Partial<Record<ObjectType, LucideIcon>> = {
  plant: SproutIcon,
  sofa: SofaIcon,
  restroom: ToiletIcon,
  exit: DoorOpenIcon,
  'meeting-room': UsersIcon,
};

type ObjectVisualProps = { typeId: ObjectType; rotation?: Rotation; className?: string };

// Images are drawn at their rotation-0 size and turned; icons stay upright inside the rotated footprint.
export function ObjectVisual({ typeId, rotation = 0, className }: ObjectVisualProps) {
  const { width, height, label } = OBJECT_TYPES[typeId];
  const image = IMAGES[typeId];
  if (image) {
    return (
      <img
        src={image}
        alt={label}
        draggable={false}
        className={cn('absolute top-1/2 left-1/2 max-w-none object-contain', className)}
        style={{
          width: width * CELL_SIZE,
          height: height * CELL_SIZE,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        }}
      />
    );
  }
  const Icon = ICONS[typeId] ?? UsersIcon;
  return (
    <span className={cn('absolute inset-1 flex items-center justify-center rounded-md bg-muted', className)}>
      <Icon className="size-5 text-muted-foreground" aria-label={label} />
    </span>
  );
}

// Small static preview for the palette.
export function ObjectThumbnail({ typeId }: { typeId: ObjectType }) {
  const image = IMAGES[typeId];
  const Icon = ICONS[typeId] ?? UsersIcon;
  return image ? (
    <img src={image} alt="" className="size-6 object-contain" />
  ) : (
    <Icon className="size-5 text-muted-foreground" aria-hidden />
  );
}
