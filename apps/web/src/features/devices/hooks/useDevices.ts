import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { deviceKeys } from '@/features/devices/api/deviceKeys';
import { type DevicesQuery, listDevices } from '@/features/devices/api/devicesApi';

export const useDevices = (query: DevicesQuery, { enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: deviceKeys.list(query),
    queryFn: ({ signal }) => listDevices(query, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
