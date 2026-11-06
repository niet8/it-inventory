import type { DeviceStatus } from '@it-inventory/contracts';

import { Badge } from '@/shared/ui/badge';

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  available: 'Available',
  in_use: 'In use',
  decommissioned: 'Decommissioned',
};

const VARIANTS = { available: 'secondary', in_use: 'default', decommissioned: 'outline' } as const;

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  return <Badge variant={VARIANTS[status]}>{DEVICE_STATUS_LABELS[status]}</Badge>;
}
