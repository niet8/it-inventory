import type { Employee as EmployeeRow } from '#generated/prisma/client';
import { Employee } from '#modules/employees/domain/Employee';

export type EmployeeRecord = Pick<EmployeeRow, 'id' | 'fullName' | 'email' | 'department'>;

export const EmployeeMapper = {
  toDomain: (row: EmployeeRecord): Employee =>
    Employee.rehydrate({ id: row.id, fullName: row.fullName, email: row.email, department: row.department }),

  toPersistence: (employee: Employee): EmployeeRecord => ({
    id: employee.id,
    fullName: employee.fullName,
    email: employee.email,
    department: employee.department,
  }),
};
