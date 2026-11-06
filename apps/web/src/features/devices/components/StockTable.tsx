import type { Device } from '@it-inventory/contracts';

import type { DeviceTransition } from '@/features/devices/api/devicesApi';
import { DeviceRowActions } from '@/features/devices/components/DeviceRowActions';
import { DeviceStatusBadge } from '@/features/devices/components/DeviceStatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

type StockTableProps = {
  devices: Device[];
  onAssign: (device: Device) => void;
  onEdit: (device: Device) => void;
  onTransition: (device: Device, transition: DeviceTransition) => void;
  onDelete: (device: Device) => void;
};

export function StockTable({ devices, onAssign, onEdit, onTransition, onDelete }: StockTableProps) {
  return (
    <Table aria-label="Devices">
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden md:table-cell">Notes</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {devices.map((device) => (
          <TableRow key={device.id}>
            <TableCell className="font-mono text-xs">{device.code ?? '—'}</TableCell>
            <TableCell className="font-medium">{device.name}</TableCell>
            <TableCell className="hidden max-w-64 truncate text-muted-foreground md:table-cell">
              {device.notes ?? ''}
            </TableCell>
            <TableCell>
              <DeviceStatusBadge status={device.status} />
            </TableCell>
            <TableCell>
              <DeviceRowActions
                device={device}
                onAssign={() => onAssign(device)}
                onEdit={() => onEdit(device)}
                onTransition={(transition) => onTransition(device, transition)}
                onDelete={() => onDelete(device)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
