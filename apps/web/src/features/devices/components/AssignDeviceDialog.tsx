import type { Device, Employee } from '@it-inventory/contracts';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';

import { useDebouncedValue } from '@/features/devices/hooks/useDebouncedValue';
import { useAssignDevice } from '@/features/devices/hooks/useDeviceMutations';
import { useEmployees } from '@/features/employees/hooks/useEmployees';
import { cn } from '@/shared/lib/utils';
import { AsyncState } from '@/shared/ui/AsyncState';
import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';

const PICKER_LIMIT = 8;

type AssignDeviceDialogProps = {
  // The dialog is open while a device is given.
  device: Device | null;
  onClose: () => void;
};

export function AssignDeviceDialog({ device, onClose }: AssignDeviceDialogProps) {
  return (
    <Dialog open={device !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>{device && <AssignForm device={device} onDone={onClose} />}</DialogContent>
    </Dialog>
  );
}

function AssignForm({ device, onDone }: { device: Device; onDone: () => void }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Employee | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim());
  const employees = useEmployees({ search: debouncedSearch || undefined, limit: PICKER_LIMIT });
  const assignDevice = useAssignDevice();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    assignDevice.mutate(
      { id: device.id, employeeId: selected.id },
      {
        onSuccess: () => {
          toast.success(`${device.name} assigned to ${selected.fullName}`);
          onDone();
        },
      },
    );
  };

  const items = employees.data?.items ?? [];

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>Assign device</DialogTitle>
        <DialogDescription>
          Choose who gets {device.name}
          {device.code && ` (${device.code})`}.
        </DialogDescription>
      </DialogHeader>

      <Input
        type="search"
        aria-label="Search employees"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <AsyncState
        isLoading={employees.isLoading}
        error={employees.error}
        onRetry={() => void employees.refetch()}
        isEmpty={items.length === 0}
        emptyMessage="No employees match."
      >
        <ul aria-label="Employees" className="grid max-h-64 gap-1 overflow-y-auto">
          {items.map((employee) => (
            <li key={employee.id}>
              <button
                type="button"
                aria-pressed={selected?.id === employee.id}
                onClick={() => setSelected(employee)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted',
                  selected?.id === employee.id && 'bg-muted ring-1 ring-ring',
                )}
              >
                <Avatar fullName={employee.fullName} />
                <span className="grid">
                  <span className="font-medium">{employee.fullName}</span>
                  <span className="text-xs text-muted-foreground">{employee.department ?? employee.email ?? ''}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </AsyncState>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={!selected || assignDevice.isPending}>
          Assign
        </Button>
      </DialogFooter>
    </form>
  );
}
