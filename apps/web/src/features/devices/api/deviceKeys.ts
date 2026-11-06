import type { DevicesQuery } from '@/features/devices/api/devicesApi';

// Every device query lives under `devices`, so one invalidation refreshes lists and stats alike.
export const deviceKeys = {
  all: ['devices'] as const,
  list: (query: DevicesQuery) => ['devices', 'list', query] as const,
  stats: ['devices', 'stats'] as const,
};
