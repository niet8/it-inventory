import type { Employee } from '#modules/employees/domain/Employee';

// Output DTO shared by every employees use case: plain data, never the aggregate.
export type EmployeeView = {
  id: string;
  fullName: string;
  email: string | null;
  department: string | null;
};

export type EmployeePageView = { items: EmployeeView[]; total: number; page: number; limit: number };

export const toEmployeeView = (employee: Employee): EmployeeView => ({
  id: employee.id,
  fullName: employee.fullName,
  email: employee.email,
  department: employee.department,
});
