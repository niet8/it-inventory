import { describe, expect, it } from 'vitest';

import { Employee } from '#modules/employees/domain/Employee';
import { EmployeeMapper } from '#modules/employees/infrastructure/persistence/mappers/EmployeeMapper';

describe('EmployeeMapper', () => {
  it('round-trips an employee through its persistence record', () => {
    const record = { id: 'e-1', fullName: 'Ana Example', email: 'ana@example.com', department: null };

    const employee = EmployeeMapper.toDomain(record);

    expect(employee).toBeInstanceOf(Employee);
    expect(EmployeeMapper.toPersistence(employee)).toEqual(record);
  });
});
