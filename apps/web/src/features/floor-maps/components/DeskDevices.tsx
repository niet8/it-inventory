import type { DeviceStatus } from '@it-inventory/contracts';
import { useQuery } from '@tanstack/react-query';

import { fetchDevicesOf, floorMapKeys } from '@/features/floor-maps/api/floorMapsApi';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';

const STATUS_LABELS: Record<DeviceStatus, string> = {
  available: 'Available',
  in_use: 'In use',
  decommissioned: 'Decommissioned',
};

export function DeskDevices({ employeeId }: { employeeId: string }) {
  const { data, isPending, error } = useQuery({
    queryKey: floorMapKeys.devicesOf(employeeId),
    queryFn: ({ signal }) => fetchDevicesOf(employeeId, signal),
  });

  if (isPending) return <Skeleton className="h-8 w-full" />;
  if (error) return <p className="text-xs text-destructive">{error.message}</p>;
  if (data.items.length === 0) return <p className="text-xs text-muted-foreground">No devices assigned</p>;

  return (
    <ul aria-label="Devices" className="grid gap-1">
      {data.items.map((device) => (
        <li key={device.id} className="flex items-center gap-2 rounded-md border px-2 py-1">
          <span className="flex-1 truncate">{device.name}</span>
          {device.code && <span className="font-mono text-xs text-muted-foreground">{device.code}</span>}
          <Badge variant="secondary">{STATUS_LABELS[device.status]}</Badge>
        </li>
      ))}
    </ul>
  );
}
