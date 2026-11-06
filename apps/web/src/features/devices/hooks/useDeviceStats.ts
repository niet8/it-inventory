import { useQuery } from '@tanstack/react-query';

import { deviceKeys } from '@/features/devices/api/deviceKeys';
import { getDeviceStats } from '@/features/devices/api/devicesApi';

export const useDeviceStats = () =>
  useQuery({ queryKey: deviceKeys.stats, queryFn: ({ signal }) => getDeviceStats(signal) });
