import type { DeviceStats as DeviceStatsData } from '@it-inventory/contracts';

import { useDeviceStats } from '@/features/devices/hooks/useDeviceStats';
import { AsyncState } from '@/shared/ui/AsyncState';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

const CARDS: { key: keyof DeviceStatsData; label: string }[] = [
  { key: 'total', label: 'Total' },
  { key: 'available', label: 'Available' },
  { key: 'inUse', label: 'In use' },
  { key: 'decommissioned', label: 'Decommissioned' },
];

export function DeviceStats() {
  const { data, isLoading, error, refetch } = useDeviceStats();

  return (
    <AsyncState isLoading={isLoading} error={error} onRetry={() => void refetch()}>
      <section aria-label="Device stats" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map(({ key, label }) => (
          <Card key={key} size="sm">
            <CardHeader>
              <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{data?.[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </AsyncState>
  );
}
