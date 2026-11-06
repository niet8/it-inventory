import type { Employee, FloorMapObject } from '@it-inventory/contracts';

import { DeskPopover } from '@/features/floor-maps/components/DeskPopover';
import { MapObjectTile } from '@/features/floor-maps/components/MapObjectTile';
import { PingPongPopover } from '@/features/floor-maps/components/PingPongPopover';
import { useHoverPopover } from '@/features/floor-maps/hooks/useHoverPopover';
import type { EditorMode } from '@/features/floor-maps/lib/editor';

type MapObjectSlotProps = {
  object: FloorMapObject;
  mode: EditorMode;
  employee: Employee | null;
  highlighted: boolean;
  onAssign: (objectId: string, employeeId: string | null) => void;
  onRotate: (objectId: string) => void;
  onRemove: (objectId: string) => void;
};

function DeskBadge({ employeeId, employee }: { employeeId: string | null; employee: Employee | null }) {
  if (!employeeId) return <span className="size-2 rounded-full border border-muted-foreground/60 bg-background" />;
  const firstName = employee?.fullName.split(' ')[0] ?? '•••';
  return (
    <span className="max-w-full truncate rounded bg-primary px-1 text-[10px] leading-4 text-primary-foreground">
      {firstName}
    </span>
  );
}

// Picks what clicking an object does in the current mode: erase removes it, otherwise desks and
// the ping-pong table open their popover.
export function MapObjectSlot({
  object,
  mode,
  employee,
  highlighted,
  onAssign,
  onRotate,
  onRemove,
}: MapObjectSlotProps) {
  const hover = useHoverPopover(mode === 'erase' || mode === 'object');
  const isDesk = object.typeId === 'desk';
  const hasPopover = isDesk || object.typeId === 'ping-pong';

  const tile = (
    <MapObjectTile
      object={object}
      highlighted={highlighted}
      onActivate={() => (mode === 'erase' ? onRemove(object.id) : hasPopover && hover.toggle())}
      onRotate={() => onRotate(object.id)}
      onRemove={() => onRemove(object.id)}
      {...(isDesk && { onPointerEnter: hover.enter, onPointerLeave: hover.leave })}
      {...(isDesk && { badge: <DeskBadge employeeId={object.employeeId} employee={employee} /> })}
    />
  );

  if (isDesk) {
    return (
      <DeskPopover
        hover={hover}
        employeeId={object.employeeId}
        employee={employee}
        onAssign={(employeeId) => onAssign(object.id, employeeId)}
      >
        {tile}
      </DeskPopover>
    );
  }
  if (object.typeId === 'ping-pong') return <PingPongPopover hover={hover}>{tile}</PingPongPopover>;
  return tile;
}
