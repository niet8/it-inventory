import type { Device, Employee } from '@it-inventory/contracts';
import { PencilIcon, Trash2Icon, UnlinkIcon } from 'lucide-react';

import { Avatar } from '@/shared/ui/Avatar';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

type EmployeeDevicesCardProps = {
  employee: Employee;
  devices: Device[];
  onEdit: () => void;
  onDelete: () => void;
  onUnassign: (device: Device) => void;
};

export function EmployeeDevicesCard({ employee, devices, onEdit, onDelete, onUnassign }: EmployeeDevicesCardProps) {
  const details = [employee.department, employee.email].filter(Boolean).join(' · ');

  return (
    <Card size="sm">
      <CardContent className="grid gap-3">
        <div className="flex items-center gap-3">
          <Avatar fullName={employee.fullName} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-medium">{employee.fullName}</h3>
            {details && <p className="truncate text-xs text-muted-foreground">{details}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label={`Edit ${employee.fullName}`}>
            <PencilIcon aria-hidden />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onDelete} aria-label={`Delete ${employee.fullName}`}>
            <Trash2Icon aria-hidden />
          </Button>
        </div>

        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No devices assigned.</p>
        ) : (
          <ul aria-label={`Devices of ${employee.fullName}`} className="grid gap-1">
            {devices.map((device) => (
              <li key={device.id} className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-sm">
                <span className="min-w-0 flex-1 truncate">{device.name}</span>
                {device.code && <span className="font-mono text-xs text-muted-foreground">{device.code}</span>}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onUnassign(device)}
                  aria-label={`Unassign ${device.name}`}
                >
                  <UnlinkIcon aria-hidden />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
