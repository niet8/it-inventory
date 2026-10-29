import type {
  AssignDeviceBodySchema,
  CreateDevicesBodySchema,
  ListDevicesQuerySchema,
  UpdateDeviceBodySchema,
} from '@it-inventory/contracts';
import { z } from 'zod';

// Bodies and queries come from the shared contract; only the path params are API-specific.
export const DeviceParamsSchema = z.object({ id: z.uuid() });

export type DeviceParams = z.output<typeof DeviceParamsSchema>;
export type CreateDevicesBody = z.output<typeof CreateDevicesBodySchema>;
export type UpdateDeviceBody = z.output<typeof UpdateDeviceBodySchema>;
export type AssignDeviceBody = z.output<typeof AssignDeviceBodySchema>;
export type ListDevicesQuery = z.output<typeof ListDevicesQuerySchema>;
