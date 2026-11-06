import type { Employee } from '#modules/employees/domain/Employee';

export type EmployeeListQuery = {
  page: number;
  limit: number;
  search?: string | undefined;
  department?: string | undefined;
};

export type EmployeePage = { items: Employee[]; total: number };

export interface IEmployeeRepository {
  findById(id: string): Promise<Employee | null>;
  // Inserts or updates. Throws ConflictError when the email is taken by another employee.
  save(employee: Employee): Promise<void>;
  // Devices and desks of the employee are released by the database (ON DELETE SET NULL).
  delete(id: string): Promise<boolean>;
  list(query: EmployeeListQuery): Promise<EmployeePage>;
}
