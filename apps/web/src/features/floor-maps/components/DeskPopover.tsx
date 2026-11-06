import type { Employee } from '@it-inventory/contracts';
import type { ReactNode } from 'react';

import { DeskDevices } from '@/features/floor-maps/components/DeskDevices';
import { EmployeePicker } from '@/features/floor-maps/components/EmployeePicker';
import type { useHoverPopover } from '@/features/floor-maps/hooks/useHoverPopover';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverAnchor, PopoverContent } from '@/shared/ui/popover';

type DeskPopoverProps = {
  hover: ReturnType<typeof useHoverPopover>;
  employeeId: string | null;
  // Null when the assigned employee is not in the loaded directory page.
  employee: Employee | null;
  onAssign: (employeeId: string | null) => void;
  children: ReactNode;
};

// Who sits at a desk and what they use; lets the desk be given to someone else or freed.
export function DeskPopover({ hover, employeeId, employee, onAssign, children }: DeskPopoverProps) {
  const name = employee?.fullName ?? (employeeId ? 'Assigned employee' : null);
  return (
    <Popover open={hover.open} onOpenChange={(open) => !open && hover.close()}>
      <PopoverAnchor asChild>
        <div className="size-full">{children}</div>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="start"
        className="w-80"
        aria-label="Desk details"
        onPointerEnter={hover.keep}
        onPointerLeave={hover.leave}
        // Portalled content still bubbles through React: keep its clicks away from the grid.
        onClick={(event) => event.stopPropagation()}
        onOpenAutoFocus={(event) => !hover.pinned && event.preventDefault()}
      >
        <div className="flex items-center gap-2">
          {name ? <Avatar fullName={name} /> : <span className="size-8 rounded-full border border-dashed" />}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{name ?? 'Free desk'}</p>
            <p className="truncate text-xs text-muted-foreground">
              {employee?.department ?? (employeeId ? 'No department' : 'Nobody sits here yet')}
            </p>
          </div>
          {employeeId && (
            <Button size="xs" variant="outline" onClick={() => onAssign(null)}>
              Unassign
            </Button>
          )}
        </div>
        {employeeId && <DeskDevices employeeId={employeeId} />}
        <EmployeePicker currentId={employeeId} onPick={(picked) => onAssign(picked.id)} />
      </PopoverContent>
    </Popover>
  );
}
