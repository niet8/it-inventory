import { describe, expect, it, vi } from 'vitest';

import { UpdateEmployee } from '#modules/employees/application/UpdateEmployee/UpdateEmployee';
import { Employee } from '#modules/employees/domain/Employee';
import { NotFoundError } from '#shared/domain/DomainError';

const stored = Employee.rehydrate({ id: 'e-1', fullName: 'Ana Example', email: 'ana@example.com', department: 'IT' });

const repository = (found: Employee | null) => ({
  findById: vi.fn().mockResolvedValue(found),
  save: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
  list: vi.fn(),
});

describe('UpdateEmployee', () => {
  it('applies the changes, saves and returns the new view', async () => {
    const employeeRepository = repository(stored);

    const view = await new UpdateEmployee(employeeRepository).execute({
      id: 'e-1',
      changes: { department: 'Finance', email: null },
    });

    expect(view).toEqual({ id: 'e-1', fullName: 'Ana Example', email: null, department: 'Finance' });
    expect(employeeRepository.save).toHaveBeenCalledWith(expect.objectContaining({ department: 'Finance' }));
  });

  it('fails when the employee does not exist', async () => {
    const employeeRepository = repository(null);

    await expect(
      new UpdateEmployee(employeeRepository).execute({ id: 'missing', changes: { fullName: 'X' } }),
    ).rejects.toThrow(NotFoundError);
    expect(employeeRepository.save).not.toHaveBeenCalled();
  });
});
