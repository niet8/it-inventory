import { describe, expect, it, vi } from 'vitest';

import { DeleteEmployee } from '#modules/employees/application/DeleteEmployee/DeleteEmployee';
import { NotFoundError } from '#shared/domain/DomainError';

const repository = (deleted: boolean) => ({
  findById: vi.fn(),
  save: vi.fn(),
  delete: vi.fn().mockResolvedValue(deleted),
  list: vi.fn(),
});

describe('DeleteEmployee', () => {
  it('deletes an existing employee', async () => {
    const employeeRepository = repository(true);

    await new DeleteEmployee(employeeRepository).execute({ id: 'e-1' });

    expect(employeeRepository.delete).toHaveBeenCalledWith('e-1');
  });

  it('fails when the employee does not exist', async () => {
    await expect(new DeleteEmployee(repository(false)).execute({ id: 'missing' })).rejects.toThrow(NotFoundError);
  });
});
