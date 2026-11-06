import type { CreateEmployeeBody, Employee, Paginated, UpdateEmployeeBody } from '@it-inventory/contracts';

import { apiRequest } from '@/shared/api/httpClient';

export type EmployeesQuery = {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  department?: string | undefined;
};

export const employeeKeys = {
  all: ['employees'] as const,
  list: (query: EmployeesQuery) => ['employees', 'list', query] as const,
};

export const listEmployees = (query: EmployeesQuery, signal: AbortSignal) =>
  apiRequest<Paginated<Employee>>('/employees', { query, signal });

export const createEmployee = (body: CreateEmployeeBody) =>
  apiRequest<Employee>('/employees', { method: 'POST', body });

export const updateEmployee = ({ id, body }: { id: string; body: UpdateEmployeeBody }) =>
  apiRequest<Employee>(`/employees/${id}`, { method: 'PATCH', body });

export const deleteEmployee = (id: string) => apiRequest<null>(`/employees/${id}`, { method: 'DELETE' });
