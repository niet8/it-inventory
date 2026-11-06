import { describe, expect, it } from 'vitest';

import { Employee } from '#modules/employees/domain/Employee';
import { ValidationError } from '#shared/domain/DomainError';

describe('Employee', () => {
  it('normalises name, email and department on creation', () => {
    const employee = Employee.create({ fullName: '  Ana   Example ', email: ' Ana@Example.COM ', department: ' IT ' });

    expect(employee.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(employee).toMatchObject({ fullName: 'Ana Example', email: 'ana@example.com', department: 'IT' });
  });

  it('stores missing or blank optional fields as null', () => {
    expect(Employee.create({ fullName: 'Bo Example', email: '  ' })).toMatchObject({ email: null, department: null });
  });

  it('rejects an empty or too long full name', () => {
    expect(() => Employee.create({ fullName: '   ' })).toThrow(ValidationError);
    expect(() => Employee.create({ fullName: 'x'.repeat(121) })).toThrow(/at most 120/);
  });

  it('returns a new instance on update, keeping omitted fields and clearing nulls', () => {
    const original = Employee.create({ fullName: 'Ana Example', email: 'ana@example.com', department: 'IT' });

    const updated = original.update({ fullName: 'Ana B. Example', department: null });

    expect(updated).not.toBe(original);
    expect(updated).toMatchObject({ id: original.id, fullName: 'Ana B. Example', email: 'ana@example.com' });
    expect(updated.department).toBeNull();
    expect(original.fullName).toBe('Ana Example');
  });

  it('rehydrates stored data without changing it', () => {
    const data = { id: 'e-1', fullName: 'Ana Example', email: null, department: 'IT' };

    expect(Employee.rehydrate(data)).toMatchObject(data);
  });
});
