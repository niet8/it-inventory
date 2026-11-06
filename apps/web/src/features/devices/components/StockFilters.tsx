import { DEVICE_STATUSES, type DeviceStatus } from '@it-inventory/contracts';

import { DEVICE_STATUS_LABELS } from '@/features/devices/components/DeviceStatusBadge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

type StockFiltersProps = {
  status: DeviceStatus | null;
  onStatusChange: (status: DeviceStatus | null) => void;
  search: string;
  onSearchChange: (search: string) => void;
};

const OPTIONS: { value: DeviceStatus | null; label: string }[] = [
  { value: null, label: 'All' },
  ...DEVICE_STATUSES.map((value) => ({ value, label: DEVICE_STATUS_LABELS[value] })),
];

export function StockFilters({ status, onStatusChange, search, onSearchChange }: StockFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <fieldset className="flex flex-wrap gap-1">
        <legend className="sr-only">Filter by status</legend>
        {OPTIONS.map(({ value, label }) => (
          <Button
            key={label}
            size="sm"
            variant={status === value ? 'secondary' : 'ghost'}
            aria-pressed={status === value}
            onClick={() => onStatusChange(value)}
          >
            {label}
          </Button>
        ))}
      </fieldset>
      <Input
        type="search"
        aria-label="Search devices"
        placeholder="Search by name or code"
        className="sm:max-w-xs"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
