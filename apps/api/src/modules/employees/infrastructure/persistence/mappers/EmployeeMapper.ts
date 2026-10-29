import type { Employee as EmployeeRow } from '#generated/prisma/client';
import { Employee } from '#modules/employees/domain/Employee';

export type EmployeeRecord = Pick<EmployeeRow, 'id' | 'fullName' | 'email' | 'department'>;

export class EmployeeMapper {
  static toDomain(row: EmployeeRecord): Employee {
    return Employee.rehydrate({ id: row.id, fullName: row.fullName, email: row.email, department: row.department });
  }

  static toPersistence(employee: Employee): EmployeeRecord {
    return { id: employee.id, fullName: employee.fullName, email: employee.email, department: employee.department };
  }
}
