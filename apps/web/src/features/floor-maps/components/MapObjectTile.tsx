import type { FloorMapObject } from '@it-inventory/contracts';
import { RotateCwIcon, XIcon } from 'lucide-react';
import type { MouseEvent, ReactNode } from 'react';

import { ObjectVisual } from '@/features/floor-maps/components/ObjectVisual';
import { OBJECT_TYPES } from '@/features/floor-maps/lib/objectTypes';
import { cn } from '@/shared/lib/utils';

type MapObjectTileProps = {
  object: FloorMapObject;
  onActivate: () => void;
  onRotate: () => void;
  onRemove: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  badge?: ReactNode;
  highlighted?: boolean;
};

const stop = (handler: () => void) => (event: MouseEvent) => {
  event.stopPropagation();
  handler();
};

// The tile itself lets clicks through, so walls can be drawn on the edges of an occupied cell;
// only the inset hit area and the controls catch them.
export function MapObjectTile({
  object,
  onActivate,
  onRotate,
  onRemove,
  onPointerEnter,
  onPointerLeave,
  badge,
  highlighted,
}: MapObjectTileProps) {
  const { label } = OBJECT_TYPES[object.typeId];
  return (
    <div className="group pointer-events-none relative size-full" data-object-id={object.id}>
      <ObjectVisual typeId={object.typeId} rotation={object.rotation} />
      <button
        type="button"
        aria-label={label}
        onClick={stop(onActivate)}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        className={cn(
          'pointer-events-auto absolute inset-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
          highlighted && 'ring-2 ring-primary',
        )}
      />
      {badge && <div className="pointer-events-none absolute inset-x-0 -bottom-1 flex justify-center">{badge}</div>}
      <div className="pointer-events-auto absolute -top-2 -right-2 z-10 hidden gap-0.5 group-focus-within:flex group-hover:flex">
        <button
          type="button"
          title="Rotate"
          aria-label={`Rotate ${label}`}
          onClick={stop(onRotate)}
          className="rounded-full border bg-background p-0.5 shadow-sm hover:bg-muted"
        >
          <RotateCwIcon className="size-3" aria-hidden />
        </button>
        <button
          type="button"
          title="Remove"
          aria-label={`Remove ${label}`}
          onClick={stop(onRemove)}
          className="rounded-full border bg-background p-0.5 shadow-sm hover:bg-destructive/10"
        >
          <XIcon className="size-3" aria-hidden />
        </button>
      </div>
    </div>
  );
}
