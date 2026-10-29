import type {
  CreateEmployeeBodySchema,
  ListEmployeesQuerySchema,
  UpdateEmployeeBodySchema,
} from '@it-inventory/contracts';
import { z } from 'zod';

// Bodies and queries come from the shared contract; only the path params are API-specific.
export const EmployeeParamsSchema = z.object({ id: z.uuid() });

export type EmployeeParams = z.output<typeof EmployeeParamsSchema>;
export type CreateEmployeeBody = z.output<typeof CreateEmployeeBodySchema>;
export type UpdateEmployeeBody = z.output<typeof UpdateEmployeeBodySchema>;
export type ListEmployeesQuery = z.output<typeof ListEmployeesQuerySchema>;
