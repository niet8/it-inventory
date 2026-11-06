import type { Device } from '@it-inventory/contracts';
import { ArchiveIcon, ArchiveRestoreIcon, PencilIcon, Trash2Icon, UnlinkIcon, UserPlusIcon } from 'lucide-react';

import type { DeviceTransition } from '@/features/devices/api/devicesApi';
import { Button } from '@/shared/ui/button';

type DeviceRowActionsProps = {
  device: Device;
  onAssign: () => void;
  onEdit: () => void;
  onTransition: (transition: DeviceTransition) => void;
  onDelete: () => void;
};

export function DeviceRowActions({ device, onAssign, onEdit, onTransition, onDelete }: DeviceRowActionsProps) {
  const { name, status } = device;

  return (
    <div className="flex justify-end gap-1">
      {status === 'available' && (
        <Button variant="ghost" size="icon-sm" onClick={onAssign} aria-label={`Assign ${name}`}>
          <UserPlusIcon aria-hidden />
        </Button>
      )}
      {status === 'in_use' && (
        <Button variant="ghost" size="icon-sm" onClick={() => onTransition('unassign')} aria-label={`Unassign ${name}`}>
          <UnlinkIcon aria-hidden />
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${name}`}>
        <PencilIcon aria-hidden />
      </Button>
      {status === 'decommissioned' ? (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onTransition('reactivate')}
          aria-label={`Reactivate ${name}`}
        >
          <ArchiveRestoreIcon aria-hidden />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onTransition('decommission')}
          aria-label={`Decommission ${name}`}
        >
          <ArchiveIcon aria-hidden />
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Delete ${name}`}>
        <Trash2Icon aria-hidden />
      </Button>
    </div>
  );
}
