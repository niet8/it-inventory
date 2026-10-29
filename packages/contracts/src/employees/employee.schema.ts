import { z } from 'zod';

import { PaginationQuerySchema } from '../common/pagination.schema.js';

const FullName = z.string().trim().min(1).max(120);
const Email = z.email().max(254);
const Department = z.string().trim().min(1).max(80);

export const EmployeeSchema = z.object({
  id: z.uuid(),
  fullName: FullName,
  email: Email.nullable(),
  department: Department.nullable(),
});

export const CreateEmployeeBodySchema = z.object({
  fullName: FullName,
  email: Email.optional(),
  department: Department.optional(),
});

// Omitted field = keep it; `null` = clear it.
export const UpdateEmployeeBodySchema = z.object({
  fullName: FullName.optional(),
  email: Email.nullable().optional(),
  department: Department.nullable().optional(),
});

export const ListEmployeesQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
  department: Department.optional(),
});

export type Employee = z.infer<typeof EmployeeSchema>;
export type CreateEmployeeBody = z.infer<typeof CreateEmployeeBodySchema>;
export type UpdateEmployeeBody = z.infer<typeof UpdateEmployeeBodySchema>;
export type ListEmployeesQuery = z.input<typeof ListEmployeesQuerySchema>;
