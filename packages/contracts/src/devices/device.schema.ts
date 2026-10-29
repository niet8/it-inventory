import { z } from 'zod';

import { PaginationQuerySchema } from '../common/pagination.schema.js';

export const DEVICE_STATUSES = ['available', 'in_use', 'decommissioned'] as const;
export const DeviceStatusSchema = z.enum(DEVICE_STATUSES);

const Name = z.string().trim().min(1).max(120);
const Code = z.string().trim().min(1).max(40);
const Notes = z.string().trim().min(1).max(500);

// `status` is derived by the API, never sent by the client: it changes through assign/unassign/decommission/reactivate.
export const DeviceSchema = z.object({
  id: z.uuid(),
  name: Name,
  code: Code.nullable(),
  notes: Notes.nullable(),
  status: DeviceStatusSchema,
  employeeId: z.uuid().nullable(),
  decommissionedAt: z.iso.datetime().nullable(),
});

// With quantity > 1, `code` is the first of a sequence ("007" → "007", "008", …).
export const CreateDevicesBodySchema = z.object({
  name: Name,
  code: Code.optional(),
  notes: Notes.optional(),
  quantity: z.number().int().min(1).max(50).default(1),
});

export const UpdateDeviceBodySchema = z.object({
  name: Name.optional(),
  code: Code.nullable().optional(),
  notes: Notes.nullable().optional(),
});

export const AssignDeviceBodySchema = z.object({ employeeId: z.uuid() });

// `employeeIds` accepts `?employeeIds=a&employeeIds=b` or a single value.
export const ListDevicesQuerySchema = PaginationQuerySchema.extend({
  status: DeviceStatusSchema.optional(),
  search: z.string().trim().max(120).optional(),
  employeeIds: z
    .union([z.uuid(), z.array(z.uuid()).max(100)])
    .transform((ids) => (Array.isArray(ids) ? ids : [ids]))
    .optional(),
});

export const DeviceStatsSchema = z.object({
  total: z.number().int(),
  available: z.number().int(),
  inUse: z.number().int(),
  decommissioned: z.number().int(),
});

export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;
export type Device = z.infer<typeof DeviceSchema>;
export type CreateDevicesBody = z.input<typeof CreateDevicesBodySchema>;
export type UpdateDeviceBody = z.infer<typeof UpdateDeviceBodySchema>;
export type AssignDeviceBody = z.infer<typeof AssignDeviceBodySchema>;
export type ListDevicesQuery = z.input<typeof ListDevicesQuerySchema>;
export type DeviceStats = z.infer<typeof DeviceStatsSchema>;
